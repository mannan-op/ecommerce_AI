from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import Address, User
from apps.catalog.models import Category, Product, ProductVariant


@override_settings(DEFAULT_PAYMENT_PROVIDER="demo")
class DemoCheckoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="buyer@example.com",
            username="buyer",
            password="password123",
        )
        category = Category.objects.create(name="Kurta", slug="kurta")
        product = Product.objects.create(
            name="Demo Kurta",
            slug="demo-kurta",
            category=category,
        )
        self.variant = ProductVariant.objects.create(
            product=product,
            sku="DEMO-KURTA",
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

    def test_demo_checkout_and_confirm(self):
        self.client.force_authenticate(user=self.user)
        self.client.post(
            "/api/cart/items/",
            {"variant_id": str(self.variant.id), "quantity": 2},
            format="json",
        )

        checkout = self.client.post(
            "/api/orders/checkout/",
            {
                "shipping_address_id": str(self.address.id),
                "idempotency_key": "demo-key-1",
            },
            format="json",
        )
        assert checkout.status_code == 201
        provider_ref = checkout.data["provider_reference"]
        order_id = checkout.data["order"]["id"]

        confirm = self.client.post(
            "/api/orders/payments/confirm/",
            {"order_id": order_id, "provider_reference": provider_ref},
            format="json",
        )
        assert confirm.status_code == 200
        assert confirm.data["order"]["status"] == "confirmed"

        self.variant.refresh_from_db()
        assert self.variant.stock_quantity == 3

    def test_payment_config_returns_demo(self):
        response = self.client.get("/api/orders/payments/config/")
        assert response.status_code == 200
        assert response.data["provider"] == "demo"
