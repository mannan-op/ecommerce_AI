from __future__ import annotations

import mimetypes
from dataclasses import dataclass


@dataclass(frozen=True)
class InlineImage:
    cid: str
    data: bytes
    mime_type: str
    filename: str


def _read_file_field(file_field) -> tuple[bytes, str] | None:
    if not file_field:
        return None
    try:
        with file_field.open("rb") as handle:
            data = handle.read()
    except (OSError, ValueError, FileNotFoundError):
        return None
    if not data:
        return None
    filename = getattr(file_field, "name", "") or "image.jpg"
    mime_type = mimetypes.guess_type(filename)[0] or "image/jpeg"
    return data, mime_type


def _inline_from_field(*, cid: str, file_field) -> InlineImage | None:
    payload = _read_file_field(file_field)
    if not payload:
        return None
    data, mime_type = payload
    filename = getattr(file_field, "name", "") or f"{cid}.jpg"
    return InlineImage(cid=cid, data=data, mime_type=mime_type, filename=filename.split("/")[-1])


def tryon_followup_inline_images(job) -> list[InlineImage]:
    """Load product + try-on images for CID embedding in customer emails."""
    images: list[InlineImage] = []
    product = job.product

    primary = product.images.filter(is_primary=True).first() or product.images.first()
    if primary:
        inline = _inline_from_field(cid="product_image", file_field=primary.image)
        if inline:
            images.append(inline)

    if job.result_image:
        inline = _inline_from_field(cid="tryon_result", file_field=job.result_image)
        if inline:
            images.append(inline)

    return images


def inline_src(cid: str) -> str:
    return f"cid:{cid}"
