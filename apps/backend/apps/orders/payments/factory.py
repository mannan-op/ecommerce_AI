from apps.orders.payments.base import PaymentProvider
from apps.orders.payments.demo_provider import DemoPaymentProvider
from apps.orders.payments.stripe_provider import (
    JazzCashPaymentProvider,
    PayFastPaymentProvider,
    StripePaymentProvider,
)

PROVIDERS: dict[str, type[PaymentProvider]] = {
    "demo": DemoPaymentProvider,
    "stripe": StripePaymentProvider,
    "payfast": PayFastPaymentProvider,
    "jazzcash": JazzCashPaymentProvider,
}


def get_payment_provider(name: str | None = None) -> PaymentProvider:
    from django.conf import settings

    from apps.common.exceptions import BusinessError

    provider_name = name or getattr(settings, "DEFAULT_PAYMENT_PROVIDER", "demo")
    provider_cls = PROVIDERS.get(provider_name)
    if not provider_cls:
        raise BusinessError(
            f"Unknown payment provider: {provider_name}",
            code="INVALID_PROVIDER",
        )
    return provider_cls()
