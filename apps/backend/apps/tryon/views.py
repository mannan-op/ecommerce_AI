from django.utils import timezone
from rest_framework import mixins, parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsStaffUser
from apps.common.throttling import StylistChatRateThrottle, TryOnRateThrottle
from apps.notifications.services import notify_csr_status_to_customer
from apps.tryon.models import CSRHandoff, TryOnJob
from apps.tryon.serializers import (
    AdminCSRHandoffSerializer,
    CSRHandoffCreateSerializer,
    CSRHandoffSerializer,
    StylistChatRequestSerializer,
    StylistChatResponseSerializer,
    TryOnJobCreateSerializer,
    TryOnJobSerializer,
)
from apps.tryon.services.factory import (
    get_tryon_provider,
    get_tryon_public_config,
    resolve_tryon_provider_name,
)
from apps.tryon.services.stylist_chat import (
    chat_with_stylist,
    get_stylist_chat_public_config,
)
from apps.tryon.tasks import enqueue_tryon_job


def _resolve_garment_url(product, variant) -> str:
    images = product.images.all().order_by("-is_primary", "sort_order")
    if variant and variant.color:
        color_match = images.filter(alt_text__icontains=variant.color).first()
        if color_match:
            return color_match.image.url
    primary = images.filter(is_primary=True).first() or images.first()
    if primary:
        return primary.image.url
    return ""


class TryOnJobViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    throttle_classes = [TryOnRateThrottle]

    def get_queryset(self):
        return TryOnJob.objects.filter(user=self.request.user).select_related(
            "product",
            "variant",
        )

    def get_serializer_class(self):
        if self.action == "create":
            return TryOnJobCreateSerializer
        return TryOnJobSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data["product"]
        variant = serializer.validated_data.get("variant")
        provider_name = resolve_tryon_provider_name()
        provider = get_tryon_provider(provider_name)

        job = TryOnJob.objects.create(
            user=request.user,
            product=product,
            variant=variant,
            user_photo=serializer.validated_data["user_photo"],
            garment_image_url=_resolve_garment_url(product, variant),
            provider=provider.name,
            consent_given=True,
            consent_at=timezone.now(),
            status=TryOnJob.Status.PENDING,
        )

        enqueue_tryon_job(str(job.id))

        output = TryOnJobSerializer(job, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny], url_path="config")
    def config(self, request):
        return Response({
            **get_tryon_public_config(),
            **get_stylist_chat_public_config(),
        })

    @action(
        detail=True,
        methods=["post"],
        url_path="stylist-chat",
        parser_classes=[parsers.JSONParser],
        throttle_classes=[StylistChatRateThrottle],
    )
    def stylist_chat(self, request, pk=None):
        job = self.get_object()
        serializer = StylistChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply = chat_with_stylist(
            job,
            serializer.validated_data["message"],
            serializer.validated_data.get("history") or [],
        )
        output = StylistChatResponseSerializer(
            {
                "reply": reply,
                "model": get_stylist_chat_public_config().get("stylist_model"),
            }
        )
        return Response(output.data)


class CSRHandoffViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CSRHandoff.objects.filter(user=self.request.user).select_related(
            "tryon_job",
            "tryon_job__product",
        )

    def get_serializer_class(self):
        if self.action == "create":
            return CSRHandoffCreateSerializer
        return CSRHandoffSerializer


class AdminCSRHandoffViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = AdminCSRHandoffSerializer

    def get_queryset(self):
        return CSRHandoff.objects.select_related(
            "tryon_job",
            "tryon_job__product",
            "user",
            "assigned_to",
        )

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        handoff = serializer.save()
        notify_csr_status_to_customer(handoff, old_status=old_status)
