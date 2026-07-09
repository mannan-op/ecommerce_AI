import logging
import os

from django.conf import settings

from apps.tryon.services.media import read_garment_bytes, write_temp_file
from apps.tryon.services.providers.base import TryOnProvider, TryOnResult

logger = logging.getLogger(__name__)


def resolve_hf_space_src(space_id: str) -> str:
    """
    Direct Gradio Space URL avoids huggingface_hub DNS lookup (space_info API).
    Slug rule: yisol/IDM-VTON -> https://yisol-idm-vton.hf.space
    """
    explicit = getattr(settings, "TRYON_HF_SPACE_URL", "").strip()
    if explicit:
        return explicit.rstrip("/")
    if space_id.startswith(("http://", "https://")):
        return space_id.rstrip("/")
    slug = space_id.strip("/").replace("/", "-").lower()
    return f"https://{slug}.hf.space"


def _create_gradio_client(space_id: str, hf_token: str):
    from gradio_client import Client

    space_src = resolve_hf_space_src(space_id)

    # HF Spaces can be slow on cold start; allow longer connect/read timeouts.
    client_kwargs: dict = {}
    try:
        import inspect

        params = inspect.signature(Client.__init__).parameters
        if "httpx_kwargs" in params:
            client_kwargs["httpx_kwargs"] = {"timeout": 120.0}
    except Exception:
        pass

    try:
        return Client(space_src, hf_token=hf_token, **client_kwargs)
    except TypeError:
        # gradio-client 2.x uses `token` instead of `hf_token`
        return Client(space_src, token=hf_token, **client_kwargs)


class HuggingFaceTryOnProvider(TryOnProvider):
    """
    Free tier — calls the public IDM-VTON Hugging Face Space via Gradio.

    Requires a free HF token (https://huggingface.co/settings/tokens).
    Subject to Hugging Face rate limits (~5 min GPU/day on free accounts).
    """

    name = "huggingface"

    def generate(
        self,
        *,
        user_photo_path: str,
        garment_image_url: str,
        product_name: str,
        product=None,
        garment_category: str = "upper_body",
    ) -> TryOnResult:
        hf_token = getattr(settings, "HF_TOKEN", "")
        space_id = getattr(settings, "TRYON_HF_SPACE", "yisol/IDM-VTON")
        if not hf_token:
            return TryOnResult(
                success=False,
                error_message=(
                    "HF_TOKEN is not configured. Create a free token at "
                    "https://huggingface.co/settings/tokens"
                ),
            )
        if product is None:
            return TryOnResult(
                success=False,
                error_message="Product context missing for garment image.",
            )

        garment_path = None
        try:
            from gradio_client import handle_file

            garment_bytes = read_garment_bytes(garment_image_url, product)
            garment_path = write_temp_file(garment_bytes, suffix=".jpg")

            client = _create_gradio_client(space_id, hf_token)
            result = client.predict(
                dict={
                    "background": handle_file(user_photo_path),
                    "layers": [],
                    "composite": None,
                },
                garm_img=handle_file(garment_path),
                garment_des=product_name[:200] or "garment",
                is_checked=True,
                is_checked_crop=False,
                denoise_steps=30,
                seed=42,
                api_name="/tryon",
            )

            output_path = self._extract_output_path(result)
            if not output_path or not os.path.exists(output_path):
                return TryOnResult(
                    success=False,
                    error_message="Hugging Face try-on returned no output image.",
                )

            with open(output_path, "rb") as handle:
                result_bytes = handle.read()

            return TryOnResult(
                success=True,
                result_bytes=result_bytes,
                provider_job_id=f"hf_{space_id.replace('/', '_')}",
            )
        except ImportError:
            return TryOnResult(
                success=False,
                error_message=(
                    "gradio-client is not installed. Rebuild Docker: "
                    "docker compose build backend celery"
                ),
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Hugging Face try-on failed")
            message = str(exc)
            if "404" in message or "page not found" in message.lower():
                message = (
                    "Hugging Face try-on space unavailable (404). "
                    "The space may be sleeping — wait 30s and try again."
                )
            elif "handshake" in message.lower() or "connecttimeout" in message.lower().replace(" ", ""):
                message = (
                    "Could not reach Hugging Face (network/SSL timeout). "
                    "Check Docker outbound HTTPS, then retry in 30s."
                )
            elif "name or service not known" in message.lower() or "errno -2" in message.lower():
                message = (
                    "Docker could not resolve Hugging Face (DNS error). "
                    "Restart Docker or set TRYON_HF_SPACE_URL in .env."
                )
            return TryOnResult(success=False, error_message=message)
        finally:
            if garment_path and os.path.exists(garment_path):
                os.unlink(garment_path)

    def _extract_output_path(self, result) -> str | None:
        if isinstance(result, (list, tuple)) and result:
            candidate = result[0]
        else:
            candidate = result

        if isinstance(candidate, str):
            return candidate
        if hasattr(candidate, "name"):
            return candidate.name
        if hasattr(candidate, "path"):
            return candidate.path
        return None
