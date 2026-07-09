"""Shared image upload validation."""

from __future__ import annotations

from io import BytesIO

from PIL import Image
from rest_framework import serializers

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_IMAGE_PIXELS = 25_000_000


def validate_image_upload(photo, *, max_bytes: int = MAX_IMAGE_BYTES) -> object:
    if photo.size > max_bytes:
        raise serializers.ValidationError(
            f"Image must be {max_bytes // (1024 * 1024)} MB or smaller."
        )

    content_type = getattr(photo, "content_type", "")
    if content_type and not content_type.startswith("image/"):
        raise serializers.ValidationError("Upload must be an image file.")

    try:
        data = photo.read()
        photo.seek(0)
        image = Image.open(BytesIO(data))
        image.verify()
        image = Image.open(BytesIO(data))
        width, height = image.size
        if width * height > MAX_IMAGE_PIXELS:
            raise serializers.ValidationError("Image dimensions are too large.")
        if image.format not in {"JPEG", "PNG", "WEBP", "GIF"}:
            raise serializers.ValidationError("Unsupported image format.")
    except serializers.ValidationError:
        raise
    except Exception as exc:
        raise serializers.ValidationError("Invalid or corrupted image file.") from exc

    photo.seek(0)
    return photo
