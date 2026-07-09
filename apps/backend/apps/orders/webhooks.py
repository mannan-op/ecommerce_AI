import logging

from django.conf import settings
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.services import notify_order_confirmed, notify_payment_failed
from apps.orders.models import Order, Payment
from apps.orders.services.inventory import reduce_stock_for_order

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """Stripe payment webhook — authoritative payment confirmation in production."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @transaction.atomic
    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        if not settings.STRIPE_WEBHOOK_SECRET:
            logger.warning("Stripe webhook received but STRIPE_WEBHOOK_SECRET is unset")
            return Response(
                {"detail": "Webhook not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            import stripe

            stripe.api_key = settings.STRIPE_SECRET_KEY
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return Response({"detail": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Stripe webhook signature verification failed")
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if event["type"] == "payment_intent.succeeded":
            intent = event["data"]["object"]
            self._handle_payment_success(intent["id"])
        elif event["type"] == "payment_intent.payment_failed":
            intent = event["data"]["object"]
            self._handle_payment_failure(intent["id"])

        return Response({"received": True})

    def _handle_payment_success(self, provider_reference: str) -> None:
        try:
            payment = Payment.objects.select_for_update().select_related(
                "order", "order__user"
            ).get(provider_reference=provider_reference, provider="stripe")
        except Payment.DoesNotExist:
            logger.warning("Stripe webhook: payment not found for %s", provider_reference)
            return

        if payment.status == Payment.Status.PAID:
            return

        order = payment.order
        reduce_stock_for_order(order)
        payment.status = Payment.Status.PAID
        payment.save(update_fields=["status", "updated_at"])
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=["status", "updated_at"])
        notify_order_confirmed(order.user, order)

    def _handle_payment_failure(self, provider_reference: str) -> None:
        try:
            payment = Payment.objects.select_for_update().select_related(
                "order", "order__user"
            ).get(provider_reference=provider_reference, provider="stripe")
        except Payment.DoesNotExist:
            return

        if payment.status == Payment.Status.PAID:
            return

        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status", "updated_at"])
        notify_payment_failed(payment.order.user, payment.order)
