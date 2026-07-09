from __future__ import annotations

from django.conf import settings

from apps.common.storage import file_url
from apps.common.email.images import inline_src, tryon_followup_inline_images


def _display_name(user) -> str:
    if user.first_name:
        return user.first_name.strip()
    local = (user.email or "").split("@")[0]
    return local.replace(".", " ").replace("_", " ").title() or "there"


def _format_price(amount) -> str | None:
    if amount is None:
        return None
    return f"${amount:.2f}"


def tryon_followup_context(*, job, user) -> dict:
    site_url = getattr(settings, "SITE_URL", "http://localhost:3000").rstrip("/")
    product = job.product

    primary_image = product.images.filter(is_primary=True).first() or product.images.first()
    inline_images = tryon_followup_inline_images(job)
    inline_cids = {image.cid for image in inline_images}

    product_image_url = (
        inline_src("product_image")
        if "product_image" in inline_cids
        else (file_url(primary_image.image) if primary_image else "")
    )
    tryon_result_url = (
        inline_src("tryon_result")
        if "tryon_result" in inline_cids
        else (file_url(job.result_image) if job.result_image else "")
    )

    variant = job.variant
    price = variant.price if variant else product.min_price
    variant_parts = []
    if variant:
        if variant.color:
            variant_parts.append(variant.color)
        if variant.size:
            variant_parts.append(f"Size {variant.size}")
        if variant.fabric_type:
            variant_parts.append(variant.fabric_type)

    product_url = f"{site_url}/products/{product.slug}"
    shop_url = f"{site_url}/shop"

    return {
        "site_name": getattr(settings, "SITE_NAME", "MAISON"),
        "site_url": site_url,
        "job": job,
        "user": user,
        "product": product,
        "customer_name": _display_name(user),
        "product_url": product_url,
        "shop_url": shop_url,
        "product_image_url": product_image_url,
        "tryon_result_url": tryon_result_url,
        "price_display": _format_price(price),
        "variant_label": " · ".join(variant_parts),
        "category_name": product.category.name if product.category_id else "",
        "completed_date": job.completed_at,
        "inline_images": inline_images,
    }
