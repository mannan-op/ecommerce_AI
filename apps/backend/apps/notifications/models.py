import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    class EventType(models.TextChoices):
        ORDER_CONFIRMED = "order.confirmed", "Order confirmed"
        PAYMENT_FAILED = "payment.failed", "Payment failed"
        ORDER_SHIPPED = "order.shipped", "Order shipped"
        ORDER_DELIVERED = "order.delivered", "Order delivered"
        ORDER_CANCELLED = "order.cancelled", "Order cancelled"
        TRYON_COMPLETED = "tryon.completed", "Try-on ready"
        TRYON_FAILED = "tryon.failed", "Try-on failed"
        CSR_CREATED = "csr.created", "Stylist request"
        CSR_CONTACTED = "csr.contacted", "Stylist contacted"
        CSR_RESOLVED = "csr.resolved", "Stylist resolved"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    event_type = models.CharField(max_length=40, choices=EventType.choices)
    title = models.CharField(max_length=160)
    body = models.TextField()
    action_url = models.CharField(max_length=500, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    dedupe_key = models.CharField(max_length=120, blank=True, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "dedupe_key"],
                condition=~models.Q(dedupe_key=""),
                name="unique_notification_dedupe_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "read_at", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.event_type} → {self.user_id}"
