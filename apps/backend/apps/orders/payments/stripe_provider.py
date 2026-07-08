from decimal import Decimal

from django.conf import settings

from apps.orders.payments.base import (
    PaymentConfirmResult,
    PaymentIntentResult,
    PaymentProvider,
)


class StripePaymentProvider(PaymentProvider):
    name = "stripe"

    def __init__(self):
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY
        self.stripe = stripe

    def create_payment_intent(
        self,
        *,
        amount: Decimal,
        currency: str,
        order_id: str,
        idempotency_key: str,
        metadata: dict | None = None,
    ) -> PaymentIntentResult:
        intent = self.stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency=currency.lower(),
            metadata={"order_id": order_id, **(metadata or {})},
            automatic_payment_methods={"enabled": True},
            idempotency_key=idempotency_key,
        )
        return PaymentIntentResult(
            provider=self.name,
            provider_reference=intent.id,
            client_secret=intent.client_secret,
            amount=amount,
        )

    def confirm_payment(self, provider_reference: str) -> PaymentConfirmResult:
        intent = self.stripe.PaymentIntent.retrieve(provider_reference)
        success = intent.status == "succeeded"
        return PaymentConfirmResult(
            success=success,
            provider_reference=provider_reference,
            status=intent.status,
            message="" if success else f"Payment status: {intent.status}",
        )

    def get_client_secret(self, provider_reference: str) -> str | None:
        intent = self.stripe.PaymentIntent.retrieve(provider_reference)
        return intent.client_secret


class PayFastPaymentProvider(PaymentProvider):
    """Stub — implement PayFast integration in Phase 2."""

    name = "payfast"

    def create_payment_intent(self, **kwargs) -> PaymentIntentResult:
        raise NotImplementedError("PayFast integration not yet implemented")

    def confirm_payment(self, provider_reference: str) -> PaymentConfirmResult:
        raise NotImplementedError("PayFast integration not yet implemented")


class JazzCashPaymentProvider(PaymentProvider):
    """Stub — implement JazzCash integration in Phase 2."""

    name = "jazzcash"

    def create_payment_intent(self, **kwargs) -> PaymentIntentResult:
        raise NotImplementedError("JazzCash integration not yet implemented")

    def confirm_payment(self, provider_reference: str) -> PaymentConfirmResult:
        raise NotImplementedError("JazzCash integration not yet implemented")
