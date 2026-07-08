import logging
import os

import replicate
from django.conf import settings

from apps.tryon.services.media import (
    download_result_bytes,
    read_garment_bytes,
    write_temp_file,
)
from apps.tryon.services.providers.base import TryOnProvider, TryOnResult

logger = logging.getLogger(__name__)


class ReplicateTryOnProvider(TryOnProvider):
    """
    IDM-VTON on Replicate — research-grade diffusion virtual try-on.

    Requires REPLICATE_API_TOKEN.
    """

    name = "replicate"

    def generate(
        self,
        *,
        user_photo_path: str,
        garment_image_url: str,
        product_name: str,
        product=None,
        garment_category: str = "upper_body",
    ) -> TryOnResult:
        token = getattr(settings, "REPLICATE_API_TOKEN", "")
        model = getattr(settings, "TRYON_REPLICATE_MODEL", "cuuupid/idm-vton")
        if not token:
            return TryOnResult(
                success=False,
                error_message=(
                    "REPLICATE_API_TOKEN is not configured. "
                    "Get one at https://replicate.com/account/api-tokens"
                ),
            )
        if product is None:
            return TryOnResult(
                success=False,
                error_message="Product context missing for garment image upload.",
            )

        os.environ["REPLICATE_API_TOKEN"] = token
        garment_path = None

        try:
            garment_bytes = read_garment_bytes(garment_image_url, product)
            garment_path = write_temp_file(garment_bytes, suffix=".jpg")

            with open(user_photo_path, "rb") as human_file, open(
                garment_path, "rb"
            ) as garment_file:
                output = replicate.run(
                    model,
                    input={
                        "human_img": human_file,
                        "garm_img": garment_file,
                        "garment_des": product_name[:200] or "garment",
                        "category": garment_category,
                        "crop": True,
                        "steps": 30,
                    },
                )

            output_url = self._extract_output_url(output)
            if not output_url:
                return TryOnResult(
                    success=False,
                    error_message="Replicate did not return a try-on image.",
                )

            result_bytes = download_result_bytes(output_url)
            return TryOnResult(
                success=True,
                result_bytes=result_bytes,
                provider_job_id="replicate",
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Replicate try-on failed")
            return TryOnResult(success=False, error_message=str(exc))
        finally:
            if garment_path and os.path.exists(garment_path):
                os.unlink(garment_path)

    def _extract_output_url(self, output) -> str | None:
        if isinstance(output, str):
            return output
        if isinstance(output, list) and output:
            first = output[0]
            if isinstance(first, str):
                return first
            if hasattr(first, "url"):
                return first.url
        if hasattr(output, "url"):
            return output.url
        return None
