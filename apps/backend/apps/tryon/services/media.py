import base64
import ipaddress
import logging
import mimetypes
import os
import socket
import tempfile
from urllib.parse import urlparse
from urllib.request import urlopen

logger = logging.getLogger(__name__)

_CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def is_local_media_url(url: str) -> bool:
    if not url:
        return True
    if url.startswith("/media/"):
        return True
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    return host in {"localhost", "127.0.0.1", "minio", "backend", "0.0.0.0"}


def _is_private_ip(hostname: str) -> bool:
    try:
        for family in (socket.AF_INET, socket.AF_INET6):
            for info in socket.getaddrinfo(hostname, None, family, socket.SOCK_STREAM):
                ip = ipaddress.ip_address(info[4][0])
                if (
                    ip.is_private
                    or ip.is_loopback
                    or ip.is_link_local
                    or ip.is_reserved
                    or ip.is_multicast
                ):
                    return True
    except socket.gaierror:
        return True
    return False


def _is_safe_remote_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False
    host = (parsed.hostname or "").lower()
    if not host or host in {"localhost", "127.0.0.1", "minio", "backend", "0.0.0.0"}:
        return False
    return not _is_private_ip(host)


def read_bytes_from_url(url: str) -> bytes | None:
    if not url or is_local_media_url(url):
        return None
    if not _is_safe_remote_url(url):
        logger.warning("Blocked unsafe garment URL fetch: %s", url)
        return None
    try:
        with urlopen(url, timeout=20) as response:  # noqa: S310
            return response.read()
    except Exception:
        logger.exception("Failed to fetch garment URL %s", url)
        return None


def read_garment_bytes(garment_image_url: str, product) -> bytes:
    """Load garment image bytes from storage or a public URL."""
    remote = read_bytes_from_url(garment_image_url)
    if remote:
        return remote

    images = product.images.all().order_by("-is_primary", "sort_order")
    image = images.first()
    if not image or not image.image:
        raise ValueError("Product has no garment image for try-on.")

    with image.image.open("rb") as handle:
        return handle.read()


def guess_content_type(path_or_name: str, default: str = "image/jpeg") -> str:
    ext = os.path.splitext(path_or_name)[1].lower()
    if ext in _CONTENT_TYPES:
        return _CONTENT_TYPES[ext]
    guessed, _ = mimetypes.guess_type(path_or_name)
    return guessed or default


def bytes_to_data_uri(data: bytes, content_type: str = "image/jpeg") -> str:
    encoded = base64.b64encode(data).decode("ascii")
    return f"data:{content_type};base64,{encoded}"


def path_to_data_uri(path: str) -> str:
    content_type = guess_content_type(path)
    with open(path, "rb") as handle:
        return bytes_to_data_uri(handle.read(), content_type)


def write_temp_file(data: bytes, suffix: str = ".jpg") -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(data)
    tmp.close()
    return tmp.name


def resolve_person_input(user_photo_path: str) -> str:
    """Base64 data URI — avoids Fal storage upload (403 on bad/missing keys)."""
    return path_to_data_uri(user_photo_path)


def resolve_garment_input(garment_image_url: str, product) -> str:
    """Public URL or base64 data URI for garment image."""
    if garment_image_url and not is_local_media_url(garment_image_url):
        return garment_image_url

    data = read_garment_bytes(garment_image_url, product)
    return bytes_to_data_uri(data, "image/jpeg")


def download_result_bytes(url: str) -> bytes:
    if not _is_safe_remote_url(url) and not is_local_media_url(url):
        raise ValueError(f"Unsafe result URL: {url}")
    with urlopen(url, timeout=60) as response:  # noqa: S310
        return response.read()
