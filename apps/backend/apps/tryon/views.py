from django.utils import timezone
from rest_framework import mixins, parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsStaffUser
from apps.tryon.models import CSRHandoff, TryOnJob
from apps.tryon.serializers import (
    AdminCSRHandoffSerializer,
    CSRHandoffCreateSerializer,
    CSRHandoffSerializer,
    TryOnJobCreateSerializer,
    TryOnJobSerializer,
)
from apps.tryon.services.factory import (
    get_tryon_provider,
    get_tryon_public_config,
    resolve_tryon_provider_name,
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
        return Response(get_tryon_public_config())


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
