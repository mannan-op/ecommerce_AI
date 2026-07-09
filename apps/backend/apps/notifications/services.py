import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.notifications.models import Notification

logger = logging.getLogger(__name__)
User = get_user_model()


def notify(
    *,
    user,
    event_type: str,
    title: str,
    body: str,
    action_url: str = "",
    payload: dict | None = None,
    dedupe_key: str = "",
) -> Notification | None:
    """Create an in-app notification (idempotent when dedupe_key is set)."""
    if dedupe_key:
        existing = Notification.objects.filter(
            user=user,
            dedupe_key=dedupe_key,
        ).first()
        if existing:
            return existing

    try:
        return Notification.objects.create(
            user=user,
            event_type=event_type,
            title=title,
            body=body,
            action_url=action_url,
            payload=payload or {},
            dedupe_key=dedupe_key,
        )
    except Exception:
        logger.exception("Failed to create notification %s for user %s", event_type, user)
        return None


def notify_order_confirmed(user, order) -> None:
    notify(
        user=user,
        event_type=Notification.EventType.ORDER_CONFIRMED,
        title="Order confirmed",
        body=f"Your order #{str(order.id)[:8]} is confirmed. We're preparing it now.",
        action_url=f"/orders/{order.id}",
        payload={"order_id": str(order.id)},
        dedupe_key=f"order.confirmed:{order.id}",
    )


def notify_payment_failed(user, order) -> None:
    notify(
        user=user,
        event_type=Notification.EventType.PAYMENT_FAILED,
        title="Payment could not be processed",
        body="Your payment didn't go through. You can retry checkout from your cart.",
        action_url="/checkout",
        payload={"order_id": str(order.id)},
        dedupe_key=f"payment.failed:{order.id}",
    )


def notify_order_status(user, order, *, event_type: str, title: str, body: str) -> None:
    notify(
        user=user,
        event_type=event_type,
        title=title,
        body=body,
        action_url=f"/orders/{order.id}",
        payload={"order_id": str(order.id), "status": order.status},
        dedupe_key=f"{event_type}:{order.id}",
    )


def notify_tryon_completed(job) -> None:
    product_name = job.product.name
    notify(
        user=job.user,
        event_type=Notification.EventType.TRYON_COMPLETED,
        title="Your try-on is ready",
        body=f"See how {product_name} looks on you — your MAISON reveal is waiting.",
        action_url=f"/products/{job.product.slug}",
        payload={
            "tryon_job_id": str(job.id),
            "product_slug": job.product.slug,
        },
        dedupe_key=f"tryon.completed:{job.id}",
    )


def notify_tryon_failed(job) -> None:
    message = job.error_message or "Try another photo with a clear, front-facing pose."
    notify(
        user=job.user,
        event_type=Notification.EventType.TRYON_FAILED,
        title="Try-on could not be completed",
        body=message[:280],
        action_url=f"/products/{job.product.slug}",
        payload={
            "tryon_job_id": str(job.id),
            "product_slug": job.product.slug,
        },
        dedupe_key=f"tryon.failed:{job.id}",
    )


def notify_csr_created_for_staff(handoff) -> None:
    product_name = handoff.tryon_job.product.name
    staff_users = User.objects.filter(is_staff=True, is_active=True)
    for staff in staff_users:
        notify(
            user=staff,
            event_type=Notification.EventType.CSR_CREATED,
            title="New stylist request",
            body=f"{handoff.user.email} asked about {product_name}.",
            action_url="/admin/tryon",
            payload={
                "csr_id": str(handoff.id),
                "tryon_job_id": str(handoff.tryon_job_id),
            },
            dedupe_key=f"csr.created:{handoff.id}:{staff.id}",
        )


def notify_csr_status_to_customer(handoff, *, old_status: str) -> None:
    if handoff.status == old_status:
        return

    if handoff.status == "contacted":
        notify(
            user=handoff.user,
            event_type=Notification.EventType.CSR_CONTACTED,
            title="Your stylist is on it",
            body="A MAISON stylist has reviewed your try-on and will follow up soon.",
            action_url=f"/products/{handoff.tryon_job.product.slug}",
            payload={"csr_id": str(handoff.id)},
            dedupe_key=f"csr.contacted:{handoff.id}",
        )
    elif handoff.status == "resolved":
        notify(
            user=handoff.user,
            event_type=Notification.EventType.CSR_RESOLVED,
            title="Stylist advice ready",
            body="Your styling request has been resolved. Check your email for details.",
            action_url=f"/products/{handoff.tryon_job.product.slug}",
            payload={"csr_id": str(handoff.id)},
            dedupe_key=f"csr.resolved:{handoff.id}",
        )


def mark_read(notification: Notification) -> Notification:
    if not notification.read_at:
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at"])
    return notification


def purge_old_notifications(retention_days: int) -> int:
    cutoff = timezone.now() - timedelta(days=retention_days)
    deleted, _ = Notification.objects.filter(created_at__lt=cutoff).delete()
    return deleted
