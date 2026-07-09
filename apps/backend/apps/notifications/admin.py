from django.contrib import admin

from apps.notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "event_type", "read_at", "created_at")
    list_filter = ("event_type", "read_at")
    search_fields = ("title", "user__email", "body")
    readonly_fields = (
        "id",
        "user",
        "event_type",
        "title",
        "body",
        "action_url",
        "payload",
        "dedupe_key",
        "read_at",
        "created_at",
    )
