from django.conf import settings

from apps.common.exceptions import BusinessError
from apps.tryon.services.providers.base import TryOnProvider
from apps.tryon.services.providers.demo import DemoTryOnProvider
from apps.tryon.services.providers.fal import FalTryOnProvider
from apps.tryon.services.providers.huggingface import HuggingFaceTryOnProvider
from apps.tryon.services.providers.replicate import ReplicateTryOnProvider

PROVIDERS: dict[str, type[TryOnProvider]] = {
    "demo": DemoTryOnProvider,
    "huggingface": HuggingFaceTryOnProvider,
    "fal": FalTryOnProvider,
    "replicate": ReplicateTryOnProvider,
}


def _gradio_client_installed() -> bool:
    try:
        import gradio_client  # noqa: F401

        return True
    except ImportError:
        return False


def _ensure_provider_deps(provider_name: str) -> None:
    if provider_name == "huggingface" and not _gradio_client_installed():
        raise BusinessError(
            "gradio-client is not installed in this Python environment. "
            "Local: cd apps/backend && .venv\\Scripts\\pip install -e . "
            "Docker: docker compose build backend celery && docker compose up -d",
            code="TRYON_DEPS_MISSING",
        )
    if provider_name == "fal":
        try:
            import fal_client  # noqa: F401
        except ImportError as exc:
            raise BusinessError(
                "fal-client is not installed. Run pip install -e . in apps/backend.",
                code="TRYON_DEPS_MISSING",
            ) from exc
    if provider_name == "replicate":
        try:
            import replicate  # noqa: F401
        except ImportError as exc:
            raise BusinessError(
                "replicate is not installed. Run pip install -e . in apps/backend.",
                code="TRYON_DEPS_MISSING",
            ) from exc


def resolve_tryon_provider_name(name: str | None = None) -> str:
    """Pick provider from explicit name or auto-detect (free providers first)."""
    provider_name = name or getattr(settings, "DEFAULT_TRYON_PROVIDER", "auto")
    if provider_name != "auto":
        return provider_name

    prefer_free = getattr(settings, "TRYON_PREFER_FREE", True)
    if prefer_free and getattr(settings, "HF_TOKEN", "") and _gradio_client_installed():
        return "huggingface"
    if getattr(settings, "FAL_KEY", ""):
        return "fal"
    if getattr(settings, "REPLICATE_API_TOKEN", ""):
        return "replicate"
    if getattr(settings, "HF_TOKEN", "") and _gradio_client_installed():
        return "huggingface"
    return "demo"


def get_tryon_provider(name: str | None = None) -> TryOnProvider:
    provider_name = resolve_tryon_provider_name(name)
    _ensure_provider_deps(provider_name)
    provider_cls = PROVIDERS.get(provider_name)
    if not provider_cls:
        raise BusinessError(
            f"Unknown try-on provider: {provider_name}",
            code="INVALID_TRYON_PROVIDER",
        )
    return provider_cls()


def get_tryon_public_config() -> dict:
    active = resolve_tryon_provider_name()
    is_demo = active == "demo"
    is_free = active in {"demo", "huggingface"}
    estimates = {"demo": 30, "huggingface": 120, "fal": 90, "replicate": 90}
    messages = {
        "demo": "Demo overlay only — add HF_TOKEN (free) for real AI try-on.",
        "huggingface": "Free IDM-VTON via Hugging Face (daily GPU limits apply).",
        "fal": "Powered by Fal FASHN virtual try-on AI.",
        "replicate": "Powered by Replicate IDM-VTON.",
    }
    return {
        "provider": active,
        "is_demo": is_demo,
        "is_free": is_free,
        "estimated_seconds": estimates.get(active, 90),
        "message": messages.get(active, f"Powered by {active}"),
    }
