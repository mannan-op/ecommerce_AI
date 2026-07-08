from django.contrib import admin

from apps.tryon.models import CSRHandoff, TryOnJob


@admin.register(TryOnJob)
class TryOnJobAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "product",
        "status",
        "provider",
        "created_at",
        "completed_at",
    )
    list_filter = ("status", "provider", "created_at")
    search_fields = ("id", "user__email", "product__name")
    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
        "completed_at",
        "consent_at",
        "provider_job_id",
    )


@admin.register(CSRHandoff)
class CSRHandoffAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "status",
        "preferred_channel",
        "contact_email",
        "created_at",
    )
    list_filter = ("status", "preferred_channel", "created_at")
    search_fields = ("id", "user__email", "contact_email", "message")
    readonly_fields = ("id", "created_at", "updated_at")
