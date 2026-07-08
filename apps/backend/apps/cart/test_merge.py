from decimal import Decimal

from django.contrib.sessions.backends.db import SessionStore
from django.test import TestCase

from apps.accounts.models import User
from apps.cart.models import Cart, CartItem
from apps.cart.services import merge_session_cart_into_user
from apps.catalog.models import Category, Product, ProductVariant


class CartMergeTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="merge@example.com",
            username="mergeuser",
            password="password123",
        )
        category = Category.objects.create(name="Shirts", slug="shirts")
        product = Product.objects.create(
            name="Cotton Shirt",
            slug="cotton-shirt",
            category=category,
        )
        self.variant_a = ProductVariant.objects.create(
            product=product,
            sku="SHIRT-A",
            price=Decimal("25.00"),
            color="blue",
            fabric_type="cotton",
        )
        self.variant_b = ProductVariant.objects.create(
            product=product,
            sku="SHIRT-B",
            price=Decimal("30.00"),
            color="white",
            fabric_type="linen",
        )

    def test_merge_combines_duplicate_quantities(self):
        session = SessionStore()
        session.create()
        session_cart = Cart.objects.create(session_key=session.session_key)
        CartItem.objects.create(cart=session_cart, variant=self.variant_a, quantity=2)

        user_cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=user_cart, variant=self.variant_a, quantity=1)

        merged = merge_session_cart_into_user(session.session_key, self.user)
        item = CartItem.objects.get(cart=merged, variant=self.variant_a)
        self.assertEqual(item.quantity, 3)
        self.assertFalse(
            Cart.objects.filter(session_key=session.session_key).exists()
        )

    def test_merge_adds_new_items(self):
        session = SessionStore()
        session.create()
        session_cart = Cart.objects.create(session_key=session.session_key)
        CartItem.objects.create(cart=session_cart, variant=self.variant_b, quantity=1)

        merge_session_cart_into_user(session.session_key, self.user)
        user_cart = Cart.objects.get(user=self.user)
        self.assertEqual(user_cart.items.count(), 1)
        self.assertEqual(
            user_cart.items.first().variant_id, self.variant_b.id
        )
