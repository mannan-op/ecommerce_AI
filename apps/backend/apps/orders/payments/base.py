from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class PaymentIntentResult:
    provider: str
    provider_reference: str
    client_secret: str
    amount: Decimal


@dataclass
class PaymentConfirmResult:
    success: bool
    provider_reference: str
    status: str
    message: str = ""


class PaymentProvider(ABC):
    name: str

    @abstractmethod
    def create_payment_intent(
        self,
        *,
        amount: Decimal,
        currency: str,
        order_id: str,
        idempotency_key: str,
        metadata: dict | None = None,
    ) -> PaymentIntentResult:
        pass

    @abstractmethod
    def confirm_payment(self, provider_reference: str) -> PaymentConfirmResult:
        pass
