from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import Address, User
from apps.orders.models import Order, OrderItem, Payment


class OrderModelTests(TestCase):
    def test_create_order_with_payment(self):
        user = User.objects.create_user(
            email="order@example.com",
            username="orderuser",
            password="password123",
        )
        address = Address.objects.create(
            user=user,
            line1="123 Main St",
            city="Springfield",
            postal_code="12345",
        )
        order = Order.objects.create(
            user=user,
            shipping_address=address,
            total=Decimal("49.99"),
        )
        OrderItem.objects.create(
            order=order,
            product_name="T-Shirt",
            variant_sku="TSHIRT-RED-M",
            color="red",
            size="M",
            quantity=1,
            unit_price=Decimal("49.99"),
        )
        payment = Payment.objects.create(order=order, amount=Decimal("49.99"))
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(payment.status, Payment.Status.PENDING)
