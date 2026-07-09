from celery import shared_task
from django.conf import settings

from apps.notifications.services import purge_old_notifications
from apps.tryon.tasks import purge_expired_user_photos


@shared_task
def purge_old_notifications_task() -> int:
    days = getattr(settings, "NOTIFICATION_RETENTION_DAYS", 90)
    return purge_old_notifications(days)


@shared_task
def purge_expired_tryon_photos_task() -> int:
    days = getattr(settings, "TRYON_PHOTO_RETENTION_DAYS", 30)
    return purge_expired_user_photos(days)
