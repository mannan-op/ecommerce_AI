from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User
from apps.cart.models import Cart, CartItem
from apps.cart.services import get_cart_for_request
from apps.catalog.models import Category, Product, ProductVariant


class CartModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="cart@example.com",
            username="cartuser",
            password="password123",
        )
        category = Category.objects.create(name="Books", slug="books")
        product = Product.objects.create(
            name="Django Book",
            slug="django-book",
            category=category,
        )
        self.variant = ProductVariant.objects.create(
            product=product,
            sku="DJANGO-BOOK",
            price=Decimal("29.99"),
            color="default",
        )

    def test_cart_total(self):
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, variant=self.variant, quantity=2)
        self.assertEqual(cart.total, Decimal("59.98"))

    def test_session_cart(self):
        from django.contrib.auth.models import AnonymousUser
        from django.contrib.sessions.backends.db import SessionStore
        from django.test import RequestFactory

        session = SessionStore()
        session.create()

        factory = RequestFactory()
        request = factory.get("/api/cart/")
        request.session = session
        request.user = AnonymousUser()

        cart = get_cart_for_request(request)
        self.assertIsNone(cart.user)
        self.assertIsNotNone(cart.session_key)
