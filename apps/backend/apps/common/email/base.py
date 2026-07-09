from abc import ABC, abstractmethod


class EmailBackend(ABC):
    @abstractmethod
    def send_order_confirmation(self, *, order, user) -> bool:
        pass

    @abstractmethod
    def send_tryon_abandoned_followup(self, *, job, user) -> bool:
        pass

    @abstractmethod
    def send_tryon_abandoned_staff_alert(self, *, job) -> bool:
        pass
