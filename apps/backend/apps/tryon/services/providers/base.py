from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class TryOnResult:
    success: bool
    result_bytes: bytes | None = None
    provider_job_id: str = ""
    error_message: str = ""


class TryOnProvider(ABC):
    name: str

    @abstractmethod
    def generate(
        self,
        *,
        user_photo_path: str,
        garment_image_url: str,
        product_name: str,
        product=None,
        garment_category: str = "auto",
    ) -> TryOnResult:
        """Run virtual try-on and return rendered image bytes."""
