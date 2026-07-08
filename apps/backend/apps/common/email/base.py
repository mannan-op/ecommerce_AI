from abc import ABC, abstractmethod


class EmailBackend(ABC):
    @abstractmethod
    def send_order_confirmation(self, *, order, user) -> bool:
        pass
