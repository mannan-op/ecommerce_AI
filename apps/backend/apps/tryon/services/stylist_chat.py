import json
import logging
import urllib.error
import urllib.request

from django.conf import settings

from apps.common.exceptions import BusinessError
from apps.tryon.models import TryOnJob

logger = logging.getLogger(__name__)

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
MAX_HISTORY_MESSAGES = 12


def _build_system_prompt(job: TryOnJob) -> str:
    product = job.product
    variant = job.variant
    lines = [
        "You are MAISON's AI personal stylist — warm, concise, and expert in Pakistani luxury fashion.",
        "The customer completed a virtual try-on. Use the product details below for fit, styling, and occasion advice.",
        "You cannot see their photos. Never claim you viewed the try-on image.",
        "Keep replies under 120 words unless they ask for more detail.",
        "",
        f"Product: {product.name}",
        f"Description: {product.description[:400]}",
    ]
    if variant:
        if variant.color:
            lines.append(f"Selected color: {variant.color}")
        if variant.size:
            lines.append(f"Selected size: {variant.size}")
        if variant.fabric_type:
            lines.append(f"Fabric: {variant.fabric_type}")
        lines.append(f"Price: ${variant.price}")
        lines.append(f"Stock: {variant.stock_quantity} units")
    if job.status == job.Status.COMPLETED:
        lines.append("Try-on status: completed successfully.")
    elif job.status == job.Status.FAILED:
        lines.append("Try-on status: failed — suggest retrying with a clearer front-facing photo.")
    return "\n".join(lines)


def _groq_headers() -> dict[str, str]:
    api_key = getattr(settings, "GROQ_API_KEY", "").strip()
    if not api_key:
        raise BusinessError(
            "AI stylist is not configured. Add GROQ_API_KEY to the backend environment.",
            code="STYLIST_NOT_CONFIGURED",
            status_code=503,
        )
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "MAISON-ecommerce/1.0 (+https://localhost)",
    }


def chat_with_stylist(
    job: TryOnJob,
    message: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    """Send a styling question to Groq and return the assistant reply."""
    cleaned = message.strip()
    if not cleaned:
        raise BusinessError("Message cannot be empty.", code="VALIDATION_ERROR")

    messages: list[dict[str, str]] = [
        {"role": "system", "content": _build_system_prompt(job)},
    ]
    for entry in (history or [])[-MAX_HISTORY_MESSAGES:]:
        role = entry.get("role", "")
        content = str(entry.get("content", "")).strip()
        if role in {"user", "assistant"} and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": cleaned})

    payload = json.dumps(
        {
            "model": getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile"),
            "messages": messages,
            "temperature": 0.6,
            "max_tokens": 512,
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        GROQ_CHAT_URL,
        data=payload,
        headers=_groq_headers(),
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        logger.warning("Groq API error %s: %s", exc.code, body[:500])
        if exc.code == 401:
            raise BusinessError(
                "Invalid Groq API key. Check GROQ_API_KEY in the backend environment.",
                code="STYLIST_AUTH_ERROR",
                status_code=503,
            ) from exc
        if exc.code == 429:
            raise BusinessError(
                "Stylist is busy (rate limit). Please wait a moment and try again.",
                code="STYLIST_RATE_LIMITED",
                status_code=429,
            ) from exc
        raise BusinessError(
            "Stylist is temporarily unavailable. Please try again in a moment.",
            code="STYLIST_UPSTREAM_ERROR",
            status_code=502,
        ) from exc
    except urllib.error.URLError as exc:
        logger.warning("Groq API unreachable: %s", exc)
        raise BusinessError(
            "Could not reach the stylist service.",
            code="STYLIST_UPSTREAM_ERROR",
            status_code=502,
        ) from exc

    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        logger.warning("Unexpected Groq response: %s", data)
        raise BusinessError(
            "Unexpected response from stylist.",
            code="STYLIST_UPSTREAM_ERROR",
            status_code=502,
        ) from exc


def get_stylist_chat_public_config() -> dict:
    enabled = bool(getattr(settings, "GROQ_API_KEY", "").strip())
    return {
        "stylist_chat_enabled": enabled,
        "stylist_provider": "groq" if enabled else None,
        "stylist_model": getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
        if enabled
        else None,
    }
