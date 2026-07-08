import uuid
from decimal import Decimal

from apps.orders.payments.base import (
    PaymentConfirmResult,
    PaymentIntentResult,
    PaymentProvider,
)


class DemoPaymentProvider(PaymentProvider):
    """Simulates payments for local development without Stripe credentials."""

    name = "demo"

    def create_payment_intent(
        self,
        *,
        amount: Decimal,
        currency: str,
        order_id: str,
        idempotency_key: str,
        metadata: dict | None = None,
    ) -> PaymentIntentResult:
        reference = f"demo_{order_id}_{uuid.uuid4().hex[:12]}"
        return PaymentIntentResult(
            provider=self.name,
            provider_reference=reference,
            client_secret=reference,
            amount=amount,
        )

    def confirm_payment(self, provider_reference: str) -> PaymentConfirmResult:
        if not provider_reference.startswith("demo_"):
            return PaymentConfirmResult(
                success=False,
                provider_reference=provider_reference,
                status="failed",
                message="Invalid demo payment reference.",
            )
        return PaymentConfirmResult(
            success=True,
            provider_reference=provider_reference,
            status="succeeded",
            message="Demo payment successful.",
        )
