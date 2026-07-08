from decimal import Decimal

from django.test import TestCase

from apps.catalog.models import Category, Product, ProductVariant


class CatalogModelTests(TestCase):
    def test_create_product_with_variant(self):
        category = Category.objects.create(name="Apparel", slug="apparel")
        product = Product.objects.create(
            name="Linen Shirt",
            slug="linen-shirt",
            category=category,
        )
        variant = ProductVariant.objects.create(
            product=product,
            sku="LINEN-SHIRT-BLUE-M",
            price=Decimal("59.99"),
            fabric_type="linen",
            color="blue",
            size="M",
        )
        self.assertEqual(product.min_price, Decimal("59.99"))
        self.assertEqual(variant.product, product)
