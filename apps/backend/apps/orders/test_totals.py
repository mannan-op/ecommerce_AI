from decimal import Decimal
from types import SimpleNamespace

from django.test import TestCase

from apps.catalog.models import Category, Product, ProductVariant
from apps.orders.services.totals import calculate_order_totals


class OrderTotalsTests(TestCase):
    def test_calculate_totals_with_shipping_and_tax(self):
        category = Category.objects.create(name="Test", slug="test")
        product = Product.objects.create(
            name="Item",
            slug="item",
            category=category,
        )
        variant = ProductVariant.objects.create(
            product=product,
            sku="ITEM-1",
            price=Decimal("100.00"),
            color="red",
        )

        item = SimpleNamespace(variant=variant, quantity=1, subtotal=variant.price)

        totals = calculate_order_totals([item])
        self.assertEqual(totals["subtotal"], Decimal("100.00"))
        self.assertGreater(totals["tax"], Decimal("0"))
        self.assertGreater(totals["total"], totals["subtotal"])
