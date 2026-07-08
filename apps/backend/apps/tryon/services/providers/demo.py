import io
import uuid

from PIL import Image, ImageDraw, ImageOps

from apps.tryon.services.media import read_garment_bytes
from apps.tryon.services.providers.base import TryOnProvider, TryOnResult


class DemoTryOnProvider(TryOnProvider):
    """Local fallback — simple garment overlay when no AI API key is configured."""

    name = "demo"

    def generate(
        self,
        *,
        user_photo_path: str,
        garment_image_url: str,
        product_name: str,
        product=None,
        garment_category: str = "auto",
    ) -> TryOnResult:
        if product is None:
            return TryOnResult(
                success=False,
                error_message="Product context missing for garment image.",
            )

        try:
            with Image.open(user_photo_path) as user_img:
                user = ImageOps.exif_transpose(user_img.convert("RGBA"))

            garment = self._load_garment(garment_image_url, product)
            if garment is None:
                return TryOnResult(
                    success=False,
                    error_message=(
                        "Could not load product image for try-on. "
                        "Set DEFAULT_TRYON_PROVIDER=auto and add FAL_KEY."
                    ),
                )

            canvas = user.copy()
            target_w = int(canvas.width * 0.55)
            scale = target_w / max(garment.width, 1)
            garment = garment.resize(
                (target_w, int(garment.height * scale)),
                Image.Resampling.LANCZOS,
            )

            x = (canvas.width - garment.width) // 2
            y = int(canvas.height * 0.28)
            overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
            overlay.paste(garment, (x, y), garment)
            blended = Image.alpha_composite(canvas, overlay)

            draw = ImageDraw.Draw(blended)
            label = f"MAISON Try-On · {product_name[:40]}"
            draw.rectangle(
                [(0, blended.height - 48), (blended.width, blended.height)],
                fill=(0, 0, 0, 160),
            )
            draw.text((16, blended.height - 34), label, fill=(255, 255, 255, 255))
            draw.text(
                (16, blended.height - 18),
                "Demo preview only — set DEFAULT_TRYON_PROVIDER=auto + FAL_KEY",
                fill=(200, 200, 200, 255),
            )

            buffer = io.BytesIO()
            blended.convert("RGB").save(buffer, format="JPEG", quality=90)
            return TryOnResult(
                success=True,
                result_bytes=buffer.getvalue(),
                provider_job_id=f"demo_{uuid.uuid4().hex[:12]}",
            )
        except Exception as exc:  # noqa: BLE001
            return TryOnResult(success=False, error_message=str(exc))

    def _load_garment(self, garment_image_url: str, product) -> Image.Image | None:
        try:
            data = read_garment_bytes(garment_image_url, product)
            with Image.open(io.BytesIO(data)) as img:
                return ImageOps.exif_transpose(img.convert("RGBA"))
        except Exception:
            return None
