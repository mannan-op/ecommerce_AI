import logging
import os

from django.conf import settings

from apps.tryon.services.media import (
    download_result_bytes,
    resolve_garment_input,
    resolve_person_input,
)
from apps.tryon.services.providers.base import TryOnProvider, TryOnResult

logger = logging.getLogger(__name__)


class FalTryOnProvider(TryOnProvider):
    """
    FASHN v1.6 on Fal.ai — commercial-grade virtual try-on.

    Requires FAL_KEY. Sends images as base64 data URIs (no Fal storage upload).
    """

    name = "fal"

    def generate(
        self,
        *,
        user_photo_path: str,
        garment_image_url: str,
        product_name: str,
        product=None,
        garment_category: str = "auto",
    ) -> TryOnResult:
        api_key = getattr(settings, "FAL_KEY", "")
        model_id = getattr(
            settings,
            "TRYON_FAL_MODEL",
            "fal-ai/fashn/tryon/v1.6",
        )
        if not api_key:
            return TryOnResult(
                success=False,
                error_message=(
                    "FAL_KEY is not configured. Add it to apps/backend/.env — "
                    "get a free key at https://fal.ai"
                ),
            )
        if product is None:
            return TryOnResult(
                success=False,
                error_message="Product context missing for garment image upload.",
            )

        os.environ["FAL_KEY"] = api_key

        try:
            import fal_client

            person_url = resolve_person_input(user_photo_path)
            garment_url = resolve_garment_input(garment_image_url, product)

            result = fal_client.subscribe(
                model_id,
                arguments={
                    "model_image": person_url,
                    "garment_image": garment_url,
                    "category": garment_category,
                    "mode": getattr(settings, "TRYON_FAL_MODE", "balanced"),
                    "garment_photo_type": "auto",
                    "output_format": "jpeg",
                    "num_samples": 1,
                },
                with_logs=False,
            )

            images = result.get("images") if isinstance(result, dict) else None
            if not images:
                return TryOnResult(
                    success=False,
                    error_message="Fal try-on returned no images.",
                )

            first = images[0]
            output_url = first.get("url") if isinstance(first, dict) else first
            if not output_url:
                return TryOnResult(
                    success=False,
                    error_message="Fal try-on image URL missing from response.",
                )

            result_bytes = download_result_bytes(output_url)
            request_id = ""
            if isinstance(result, dict):
                request_id = str(result.get("request_id") or result.get("id") or "")

            return TryOnResult(
                success=True,
                result_bytes=result_bytes,
                provider_job_id=request_id or "fal",
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Fal try-on failed")
            message = str(exc)
            if "403" in message or "Forbidden" in message:
                message = (
                    "Fal API rejected the request (403). Check FAL_KEY in "
                    "apps/backend/.env — generate a new key at https://fal.ai/dashboard/keys"
                )
            return TryOnResult(success=False, error_message=message)
