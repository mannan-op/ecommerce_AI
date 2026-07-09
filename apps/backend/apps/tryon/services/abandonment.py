import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.common.email.factory import get_email_backend
from apps.notifications.services import (
    notify_tryon_abandoned,
    notify_tryon_abandoned_for_staff,
)
from apps.orders.models import Order, OrderItem, Payment
from apps.tryon.models import TryOnJob

logger = logging.getLogger(__name__)


def user_purchased_after_tryon(job: TryOnJob) -> bool:
    """True if the customer placed a paid order for this product after try-on."""
    if not job.completed_at:
        return False

    items = OrderItem.objects.filter(
        order__user=job.user,
        order__status=Order.Status.CONFIRMED,
        order__payment__status=Payment.Status.PAID,
        order__created_at__gte=job.completed_at,
    )
    if job.variant_id:
        return items.filter(variant_sku=job.variant.sku).exists()
    return items.filter(product_name=job.product.name).exists()


def send_abandonment_followup(job: TryOnJob) -> None:
    notify_tryon_abandoned(job)
    notify_tryon_abandoned_for_staff(job)

    backend = get_email_backend()
    try:
        backend.send_tryon_abandoned_followup(job=job, user=job.user)
    except Exception:
        logger.exception("Customer abandonment email failed for try-on %s", job.id)

    try:
        backend.send_tryon_abandoned_staff_alert(job=job)
    except Exception:
        logger.exception("Staff abandonment email failed for try-on %s", job.id)

    job.abandonment_followup_sent_at = timezone.now()
    job.save(update_fields=["abandonment_followup_sent_at", "updated_at"])


def process_abandoned_tryon_followups(seconds: int | None = None) -> int:
    """
    Find completed try-ons with no purchase after the wait window;
    email the customer, alert staff, and record in-app notifications.
    """
    if not getattr(settings, "TRYON_ABANDONMENT_ENABLED", True):
        return 0

    wait_seconds = seconds if seconds is not None else getattr(
        settings, "TRYON_ABANDONMENT_SECONDS", 86400
    )
    cutoff = timezone.now() - timedelta(seconds=wait_seconds)

    jobs = (
        TryOnJob.objects.filter(
            status=TryOnJob.Status.COMPLETED,
            completed_at__isnull=False,
            completed_at__lte=cutoff,
            abandonment_followup_sent_at__isnull=True,
        )
        .select_related("user", "product", "product__category", "variant")
        .prefetch_related("csr_handoffs", "product__images")
    )

    processed = 0
    for job in jobs:
        if job.csr_handoffs.exists():
            continue
        if user_purchased_after_tryon(job):
            continue
        send_abandonment_followup(job)
        processed += 1

    return processed
