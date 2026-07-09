import logging
import os
import tempfile
from datetime import timedelta

from celery import shared_task
from django.core.files.base import ContentFile
from django.utils import timezone

from apps.tryon.models import TryOnJob
from apps.tryon.services.factory import get_tryon_provider
from apps.notifications.services import notify_tryon_completed, notify_tryon_failed

logger = logging.getLogger(__name__)


def _garment_category(product, provider: str) -> str:
    name = (product.category.name if product.category_id else "").lower()
    slug = (product.category.slug if product.category_id else "").lower()
    blob = f"{name} {slug} {product.name.lower()}"

    if provider == "fal":
        if any(word in blob for word in ("dress", "gown", "jumpsuit", "one-piece")):
            return "one-pieces"
        if any(word in blob for word in ("pant", "trouser", "skirt", "bottom", "jean")):
            return "bottoms"
        return "auto"

    # huggingface + replicate share IDM-VTON categories
    if any(word in blob for word in ("dress", "gown", "jumpsuit")):
        return "dresses"
    if any(word in blob for word in ("pant", "trouser", "skirt", "bottom", "jean")):
        return "lower_body"
    return "upper_body"


def _local_photo_path(job: TryOnJob) -> tuple[str, bool]:
    """Return (path, is_temp) for the user photo file."""
    try:
        path = job.user_photo.path
        if os.path.exists(path):
            return path, False
    except (NotImplementedError, ValueError, AttributeError):
        pass

    suffix = os.path.splitext(job.user_photo.name)[1] or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    with job.user_photo.open("rb") as photo:
        tmp.write(photo.read())
    tmp.close()
    return tmp.name, True


@shared_task(bind=True, max_retries=2, default_retry_delay=10)
def process_tryon_job(self, job_id: str) -> None:
    try:
        job = TryOnJob.objects.select_related(
            "product",
            "variant",
            "product__category",
        ).prefetch_related("product__images").get(id=job_id)
    except TryOnJob.DoesNotExist:
        logger.warning("TryOnJob %s not found", job_id)
        return

    if job.status in {TryOnJob.Status.COMPLETED, TryOnJob.Status.FAILED}:
        return

    job.status = TryOnJob.Status.PROCESSING
    job.save(update_fields=["status", "updated_at"])

    photo_path, is_temp = _local_photo_path(job)
    result = None
    try:
        provider = get_tryon_provider(job.provider or None)
        result = provider.generate(
            user_photo_path=photo_path,
            garment_image_url=job.garment_image_url,
            product_name=job.product.name,
            product=job.product,
            garment_category=_garment_category(job.product, job.provider),
        )
    finally:
        if is_temp:
            os.unlink(photo_path)

    if result and result.success and result.result_bytes:
        filename = f"result_{job.id}.jpg"
        job.result_image.save(filename, ContentFile(result.result_bytes), save=False)
        job.status = TryOnJob.Status.COMPLETED
        job.provider_job_id = result.provider_job_id
        job.error_message = ""
        job.completed_at = timezone.now()
        job.save(
            update_fields=[
                "result_image",
                "status",
                "provider_job_id",
                "error_message",
                "completed_at",
                "updated_at",
            ]
        )
        notify_tryon_completed(job)
        return

    job.status = TryOnJob.Status.FAILED
    job.error_message = (
        (result.error_message if result else None) or "Try-on generation failed."
    )
    job.provider_job_id = getattr(result, "provider_job_id", "") or ""
    job.save(
        update_fields=["status", "error_message", "provider_job_id", "updated_at"]
    )
    notify_tryon_failed(job)


def enqueue_tryon_job(job_id: str) -> None:
    """Queue job on Celery; inline only in DEBUG when workers are unavailable."""
    from django.conf import settings

    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        process_tryon_job.delay(str(job_id))
        return

    try:
        from celery import current_app

        inspector = current_app.control.inspect(timeout=1.0)
        if inspector.ping():
            process_tryon_job.delay(str(job_id))
            return
    except Exception:
        logger.warning("Celery inspect failed for try-on job %s", job_id)

    if settings.DEBUG:
        logger.warning("No Celery workers detected; processing try-on inline (dev only)")
        process_tryon_job(str(job_id))
        return

    TryOnJob.objects.filter(id=job_id).update(
        status=TryOnJob.Status.FAILED,
        error_message="Try-on queue is temporarily unavailable. Please try again.",
    )
    try:
        job = TryOnJob.objects.get(id=job_id)
        notify_tryon_failed(job)
    except TryOnJob.DoesNotExist:
        pass


def purge_expired_user_photos(retention_days: int) -> int:
    """Delete user photos for jobs older than retention window."""
    cutoff = timezone.now() - timedelta(days=retention_days)
    expired = TryOnJob.objects.filter(
        created_at__lt=cutoff,
        user_photo__isnull=False,
    ).exclude(user_photo="")

    count = 0
    for job in expired.iterator():
        if job.user_photo:
            job.user_photo.delete(save=False)
            job.user_photo = ""
            job.save(update_fields=["user_photo", "updated_at"])
            count += 1
    return count
