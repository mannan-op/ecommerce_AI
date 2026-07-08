from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalog.models import Category, Product, ProductVariant


class ProductFilterAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        category = Category.objects.create(name="Apparel", slug="apparel")
        cotton = Product.objects.create(
            name="Cotton Kurta",
            slug="cotton-kurta",
            category=category,
        )
        linen = Product.objects.create(
            name="Linen Shirt",
            slug="linen-shirt",
            category=category,
        )
        ProductVariant.objects.create(
            product=cotton,
            sku="KURTA-COTTON",
            price=Decimal("40.00"),
            color="white",
            fabric_type="cotton",
        )
        ProductVariant.objects.create(
            product=linen,
            sku="SHIRT-LINEN",
            price=Decimal("80.00"),
            color="blue",
            fabric_type="linen",
        )

    def test_search_by_name(self):
        response = self.client.get("/api/catalog/products/", {"search": "Kurta"})
        self.assertEqual(response.status_code, 200)
        names = [p["name"] for p in response.data["results"]]
        self.assertEqual(names, ["Cotton Kurta"])

    def test_filter_by_fabric(self):
        response = self.client.get("/api/catalog/products/", {"fabric": "linen"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["slug"], "linen-shirt")

    def test_price_range_filter(self):
        response = self.client.get(
            "/api/catalog/products/",
            {"min_price": "50", "max_price": "100"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)

    def test_pagination_metadata(self):
        response = self.client.get("/api/catalog/products/", {"page": 1})
        self.assertEqual(response.status_code, 200)
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
        self.assertIn("results", response.data)


class PasswordResetThrottleTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_password_reset_endpoint_exists(self):
        response = self.client.post(
            "/api/accounts/password-reset/",
            {"email": "nobody@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
