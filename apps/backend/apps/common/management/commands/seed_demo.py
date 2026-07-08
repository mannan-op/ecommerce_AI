from decimal import Decimal
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from PIL import Image, ImageDraw

from apps.accounts.models import Address, User
from apps.catalog.models import Category, Product, ProductImage, ProductVariant
from apps.common.demo_data import DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_USERS


def _placeholder_image(name: str, color: tuple[int, int, int]) -> ContentFile:
    """Generate a simple placeholder JPEG for product cards."""
    img = Image.new("RGB", (600, 800), color)
    draw = ImageDraw.Draw(img)
    draw.rectangle((40, 40, 560, 760), outline=(255, 255, 255), width=3)
    label = name[:28] + ("…" if len(name) > 28 else "")
    draw.text((60, 360), label, fill=(255, 255, 255))
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    filename = f"{name[:40].replace(' ', '-').lower()}.jpg"
    return ContentFile(buffer.getvalue(), name=filename)


class Command(BaseCommand):
    help = "Load demo categories, products, variants, images, and test users."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing demo catalog data and demo users before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["clear"]:
            self._clear_demo_data()

        categories = self._seed_categories()
        product_count, variant_count = self._seed_products(categories)
        user_count, address_count = self._seed_users()

        self.stdout.write(self.style.SUCCESS("Demo data loaded successfully."))
        self.stdout.write(f"  Categories: {len(categories)}")
        self.stdout.write(f"  Products:   {product_count}")
        self.stdout.write(f"  Variants:   {variant_count}")
        self.stdout.write(f"  Users:      {user_count}")
        self.stdout.write(f"  Addresses:  {address_count}")
        self.stdout.write("")
        self.stdout.write("Demo accounts:")
        self.stdout.write("  Customer: demo@example.com / demo12345")
        self.stdout.write("  Admin:    admin@example.com / admin12345")

    def _clear_demo_data(self):
        demo_slugs = [p["slug"] for p in DEMO_PRODUCTS]
        demo_skus = [
            v["sku"] for p in DEMO_PRODUCTS for v in p["variants"]
        ]
        demo_emails = [u["email"] for u in DEMO_USERS]
        category_slugs = [c["slug"] for c in DEMO_CATEGORIES]

        ProductImage.objects.filter(product__slug__in=demo_slugs).delete()
        ProductVariant.objects.filter(sku__in=demo_skus).delete()
        Product.objects.filter(slug__in=demo_slugs).delete()
        Category.objects.filter(slug__in=category_slugs).delete()
        Address.objects.filter(user__email__in=demo_emails).delete()
        User.objects.filter(email__in=demo_emails).delete()
        self.stdout.write("Cleared previous demo data.")

    def _seed_categories(self) -> dict[str, Category]:
        categories: dict[str, Category] = {}
        for data in DEMO_CATEGORIES:
            category, _ = Category.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                    "description": data["description"],
                },
            )
            categories[data["slug"]] = category
        return categories

    def _seed_products(self, categories: dict[str, Category]) -> tuple[int, int]:
        product_count = 0
        variant_count = 0

        for data in DEMO_PRODUCTS:
            product, created = Product.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                    "description": data["description"],
                    "category": categories[data["category"]],
                    "is_active": True,
                },
            )
            if created:
                product_count += 1

            if not product.images.exists():
                image_file = _placeholder_image(data["name"], data["image_color"])
                ProductImage.objects.create(
                    product=product,
                    image=image_file,
                    alt_text=data["name"],
                    is_primary=True,
                    sort_order=0,
                )

            for variant_data in data["variants"]:
                _, v_created = ProductVariant.objects.update_or_create(
                    sku=variant_data["sku"],
                    defaults={
                        "product": product,
                        "price": Decimal(variant_data["price"]),
                        "fabric_type": variant_data["fabric"],
                        "color": variant_data["color"],
                        "size": variant_data.get("size", ""),
                        "stock_quantity": variant_data["stock"],
                        "is_active": True,
                    },
                )
                if v_created:
                    variant_count += 1

        return product_count, variant_count

    def _seed_users(self) -> tuple[int, int]:
        user_count = 0
        address_count = 0

        for data in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "username": data["email"],
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "phone": data["phone"],
                    "is_staff": data["is_staff"],
                    "is_superuser": data["is_superuser"],
                },
            )
            if created:
                user.set_password(data["password"])
                user.save()
                user_count += 1
            else:
                user.first_name = data["first_name"]
                user.last_name = data["last_name"]
                user.phone = data["phone"]
                user.is_staff = data["is_staff"]
                user.is_superuser = data["is_superuser"]
                user.save()

            for addr in data["addresses"]:
                _, a_created = Address.objects.update_or_create(
                    user=user,
                    label=addr["label"],
                    line1=addr["line1"],
                    defaults={
                        "line2": addr["line2"],
                        "city": addr["city"],
                        "state": addr["state"],
                        "postal_code": addr["postal_code"],
                        "country": addr["country"],
                        "is_default": addr["is_default"],
                    },
                )
                if a_created:
                    address_count += 1

        return user_count, address_count
