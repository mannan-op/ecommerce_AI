from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from apps.accounts.models import Address, User
from apps.catalog.models import Category, Product, ProductVariant


class SeedDemoCommandTests(TestCase):
    def test_seed_demo_loads_catalog_and_users(self):
        out = StringIO()
        call_command("seed_demo", stdout=out)

        self.assertEqual(Category.objects.count(), 4)
        self.assertEqual(Product.objects.count(), 10)
        self.assertGreaterEqual(ProductVariant.objects.count(), 26)
        self.assertTrue(User.objects.filter(email="demo@example.com").exists())
        self.assertTrue(User.objects.filter(email="admin@example.com").exists())
        self.assertGreaterEqual(Address.objects.count(), 2)

    def test_seed_demo_clear_and_reload(self):
        call_command("seed_demo")
        call_command("seed_demo", "--clear")

        self.assertEqual(Category.objects.count(), 4)
        self.assertEqual(Product.objects.count(), 10)
