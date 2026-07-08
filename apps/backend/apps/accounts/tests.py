from django.test import TestCase

from apps.accounts.models import Address, User


class AddressModelTests(TestCase):
    def test_default_address_unsets_others(self):
        user = User.objects.create_user(
            email="addr@example.com",
            username="addruser",
            password="password123",
        )
        first = Address.objects.create(
            user=user,
            line1="1 First St",
            city="Austin",
            postal_code="78701",
            is_default=True,
        )
        second = Address.objects.create(
            user=user,
            line1="2 Second St",
            city="Austin",
            postal_code="78702",
            is_default=True,
        )
        first.refresh_from_db()
        self.assertFalse(first.is_default)
        self.assertTrue(second.is_default)
