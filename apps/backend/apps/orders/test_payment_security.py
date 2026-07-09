from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import Address, User
from apps.catalog.models import Category, Product, ProductVariant


@override_settings(DEFAULT_PAYMENT_PROVIDER="demo")
class PaymentSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="buyer@example.com",
            username="buyer",
            password="password123",
        )
        category = Category.objects.create(name="Kurta", slug="kurta-pay")
        product = Product.objects.create(
            name="Pay Kurta",
            slug="pay-kurta",
            category=category,
        )
        self.variant = ProductVariant.objects.create(
            product=product,
            sku="PAY-KURTA",
            price=Decimal("29.99"),
            color="white",
            stock_quantity=5,
        )
        self.address = Address.objects.create(
            user=self.user,
            label="Home",
            line1="123 Main St",
            city="Karachi",
            postal_code="75500",
            country="PK",
        )

    def test_checkout_uses_server_payment_provider_only(self):
        self.client.force_authenticate(user=self.user)
        self.client.post(
            "/api/cart/items/",
            {"variant_id": str(self.variant.id), "quantity": 1},
            format="json",
        )
        response = self.client.post(
            "/api/orders/checkout/",
            {
                "shipping_address_id": str(self.address.id),
                "idempotency_key": "pay-sec-1",
                "payment_provider": "stripe",
            },
            format="json",
        )
        assert response.status_code == 201
        assert response.data["provider"] == "demo"

    def test_health_endpoint(self):
        response = self.client.get("/api/health/")
        assert response.status_code == 200
        assert response.data["status"] == "ok"
