import uuid

from django.conf import settings
from django.db import models


def tryon_user_photo_path(instance: "TryOnJob", filename: str) -> str:
    return f"tryon/user-photos/{instance.id}/{filename}"


def tryon_result_path(instance: "TryOnJob", filename: str) -> str:
    return f"tryon/results/{instance.id}/{filename}"


class TryOnJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tryon_jobs",
    )
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="tryon_jobs",
    )
    variant = models.ForeignKey(
        "catalog.ProductVariant",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="tryon_jobs",
    )
    user_photo = models.ImageField(upload_to=tryon_user_photo_path)
    result_image = models.ImageField(
        upload_to=tryon_result_path,
        blank=True,
        null=True,
    )
    garment_image_url = models.URLField(max_length=2048, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    provider = models.CharField(max_length=32, blank=True)
    provider_job_id = models.CharField(max_length=255, blank=True)
    error_message = models.TextField(blank=True)
    consent_given = models.BooleanField(default=False)
    consent_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    abandonment_followup_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"TryOn {self.id} ({self.status})"


class CSRHandoff(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONTACTED = "contacted", "Contacted"
        RESOLVED = "resolved", "Resolved"

    class Channel(models.TextChoices):
        EMAIL = "email", "Email"
        WHATSAPP = "whatsapp", "WhatsApp"
        PHONE = "phone", "Phone"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tryon_job = models.ForeignKey(
        TryOnJob,
        on_delete=models.CASCADE,
        related_name="csr_handoffs",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="csr_handoffs",
    )
    message = models.TextField()
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=32, blank=True)
    preferred_channel = models.CharField(
        max_length=16,
        choices=Channel.choices,
        default=Channel.EMAIL,
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    staff_notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_csr_handoffs",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"CSR {self.id} ({self.status})"
