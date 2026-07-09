"""Resolve media file URLs — direct or presigned when the bucket is private."""

from __future__ import annotations

import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def file_url(file_field) -> str:
    """Return a browser-ready URL for a stored file."""
    if not file_field:
        return ""

    if not getattr(settings, "USE_S3", False):
        return file_field.url

    if not getattr(settings, "S3_PRIVATE_MEDIA", False):
        return file_field.url

    try:
        import boto3
        from botocore.config import Config

        client = boto3.client(
            "s3",
            endpoint_url=getattr(settings, "AWS_S3_ENDPOINT_URL", None),
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=getattr(settings, "AWS_S3_REGION_NAME", "us-east-1"),
            config=Config(signature_version="s3v4"),
        )
        key = file_field.name
        if key.startswith("media/"):
            key = key[6:]
        elif not key.startswith("media/"):
            key = f"media/{key}"

        return client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": key,
            },
            ExpiresIn=getattr(settings, "S3_PRESIGNED_URL_EXPIRY", 3600),
        )
    except Exception:
        logger.exception("Failed to generate presigned URL for %s", file_field.name)
        return file_field.url
