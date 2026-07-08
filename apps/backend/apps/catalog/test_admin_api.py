from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Category, Product, ProductVariant


class AdminAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(
            email="staff@example.com",
            username="staff",
            password="password123",
            is_staff=True,
        )
        self.customer = User.objects.create_user(
            email="customer@example.com",
            username="customer",
            password="password123",
        )
        self.category = Category.objects.create(name="Kurta", slug="kurta")
        self.product = Product.objects.create(
            name="Test Kurta",
            slug="test-kurta",
            category=self.category,
        )
        ProductVariant.objects.create(
            product=self.product,
            sku="TEST-KURTA",
            price=Decimal("29.99"),
            color="white",
        )

    def test_admin_products_requires_staff(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get("/api/admin/catalog/products/")
        self.assertEqual(response.status_code, 403)

    def test_admin_products_list_for_staff(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get("/api/admin/catalog/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)

    def test_admin_create_product(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            "/api/admin/catalog/products/",
            {
                "name": "New Product",
                "slug": "new-product",
                "description": "Desc",
                "category": str(self.category.id),
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Product.objects.filter(slug="new-product").exists())

    def test_admin_categories_crud(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            "/api/admin/catalog/categories/",
            {"name": "Lawn", "slug": "lawn", "description": "Lawn suits"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_admin_variant_create(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            "/api/admin/catalog/variants/",
            {
                "product": str(self.product.id),
                "sku": "TEST-KURTA-2",
                "price": "39.99",
                "fabric_type": "cotton",
                "color": "blue",
                "size": "M",
                "stock_quantity": 10,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
