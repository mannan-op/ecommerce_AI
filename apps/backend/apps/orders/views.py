import logging

from django.conf import settings
from django.db import transaction
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.cart.services import get_cart_for_request
from apps.common.email.factory import get_email_backend
from apps.common.exceptions import BusinessError
from apps.orders.models import Order, OrderItem, Payment
from apps.orders.payments.factory import get_payment_provider
from apps.orders.serializers import (
    CheckoutCreateSerializer,
    OrderSerializer,
    PaymentConfirmSerializer,
)
from apps.orders.services.inventory import reduce_stock_for_order, validate_cart_stock
from apps.orders.services.totals import calculate_order_totals

logger = logging.getLogger(__name__)


class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("shipping_address", "payment")
            .prefetch_related("items")
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="payments/config",
        permission_classes=[AllowAny],
    )
    def payment_config(self, request):
        provider = getattr(settings, "DEFAULT_PAYMENT_PROVIDER", "demo")
        return Response(
            {
                "provider": provider,
                "stripe_publishable_key": (
                    settings.STRIPE_PUBLISHABLE_KEY
                    if provider == "stripe"
                    else ""
                ),
            }
        )

    @action(detail=False, methods=["post"], url_path="checkout/preview")
    def checkout_preview(self, request):
        cart = get_cart_for_request(request)
        cart_items = list(cart.items.select_related("variant", "variant__product"))
        if not cart_items:
            raise BusinessError("Cart is empty.", code="CART_EMPTY")

        validate_cart_stock(cart_items)
        totals = calculate_order_totals(cart_items)
        items = [
            {
                "product_name": item.variant.product.name,
                "variant_sku": item.variant.sku,
                "quantity": item.quantity,
                "unit_price": str(item.variant.price),
                "subtotal": str(item.subtotal),
            }
            for item in cart_items
        ]
        return Response({**{k: str(v) for k, v in totals.items()}, "items": items})

    @action(detail=False, methods=["post"], url_path="checkout")
    @transaction.atomic
    def checkout(self, request):
        serializer = CheckoutCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        idempotency_key = serializer.validated_data["idempotency_key"]
        existing = Order.objects.filter(
            user=request.user, idempotency_key=idempotency_key
        ).first()
        if existing:
            payment = existing.payment
            client_secret = None
            if payment.provider and payment.provider_reference:
                provider = get_payment_provider(payment.provider)
                if hasattr(provider, "get_client_secret"):
                    try:
                        client_secret = provider.get_client_secret(
                            payment.provider_reference
                        )
                    except Exception:
                        client_secret = None
                elif payment.provider == "demo":
                    client_secret = payment.provider_reference
            return Response(
                {
                    "order": OrderSerializer(existing).data,
                    "client_secret": client_secret,
                    "provider_reference": payment.provider_reference,
                    "provider": payment.provider,
                    "duplicate": True,
                }
            )

        address = serializer.context["address"]
        cart = get_cart_for_request(request)
        cart_items = list(cart.items.select_related("variant", "variant__product"))
        if not cart_items:
            raise BusinessError("Cart is empty.", code="CART_EMPTY")

        validate_cart_stock(cart_items)
        totals = calculate_order_totals(cart_items)
        order = Order.objects.create(
            user=request.user,
            shipping_address=address,
            subtotal=totals["subtotal"],
            shipping_cost=totals["shipping_cost"],
            tax=totals["tax"],
            discount=totals["discount"],
            total=totals["total"],
            idempotency_key=idempotency_key,
        )

        OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order,
                    product_name=item.variant.product.name,
                    variant_sku=item.variant.sku,
                    fabric_type=item.variant.fabric_type,
                    color=item.variant.color,
                    size=item.variant.size,
                    quantity=item.quantity,
                    unit_price=item.variant.price,
                )
                for item in cart_items
            ]
        )

        provider_name = serializer.validated_data.get("payment_provider")
        provider = get_payment_provider(provider_name)
        intent = provider.create_payment_intent(
            amount=totals["total"],
            currency=getattr(settings, "PAYMENT_CURRENCY", "usd"),
            order_id=str(order.id),
            idempotency_key=idempotency_key,
        )

        Payment.objects.create(
            order=order,
            amount=totals["total"],
            provider=intent.provider,
            provider_reference=intent.provider_reference,
        )

        return Response(
            {
                "order": OrderSerializer(order).data,
                "client_secret": intent.client_secret,
                "provider_reference": intent.provider_reference,
                "provider": intent.provider,
                "duplicate": False,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="payments/confirm")
    @transaction.atomic
    def confirm_payment(self, request):
        serializer = PaymentConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data["order_id"]
        provider_reference = serializer.validated_data["provider_reference"]

        try:
            order = (
                Order.objects.select_for_update()
                .select_related("payment", "shipping_address")
                .get(pk=order_id, user=request.user)
            )
        except Order.DoesNotExist as exc:
            raise BusinessError(
                "Order not found.", code="NOT_FOUND", status_code=404
            ) from exc

        payment = order.payment
        if payment.status == Payment.Status.PAID:
            return Response(
                {"order": OrderSerializer(order).data, "already_paid": True}
            )

        if provider_reference != payment.provider_reference:
            raise BusinessError(
                "Payment reference does not match this order.",
                code="PAYMENT_MISMATCH",
                status_code=400,
            )

        provider = get_payment_provider(payment.provider)
        result = provider.confirm_payment(provider_reference)

        if result.success:
            reduce_stock_for_order(order)
            payment.status = Payment.Status.PAID
            payment.provider_reference = result.provider_reference
            payment.save(update_fields=["status", "provider_reference", "updated_at"])
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=["status", "updated_at"])
            get_cart_for_request(request).items.all().delete()
            try:
                get_email_backend().send_order_confirmation(
                    order=order, user=request.user
                )
            except Exception:
                logger.exception(
                    "Order confirmation email failed for order %s", order.id
                )
            return Response(
                {"order": OrderSerializer(order).data, "already_paid": False}
            )

        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status", "updated_at"])
        raise BusinessError(
            result.message or "Payment failed.",
            code="PAYMENT_FAILED",
            status_code=402,
        )
