import io
from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image

from apps.accounts.models import User
from apps.catalog.models import Category, Product, ProductVariant
from apps.notifications.models import Notification
from apps.orders.models import Order, OrderItem, Payment
from apps.accounts.models import Address
from apps.tryon.models import CSRHandoff, TryOnJob
from apps.tryon.services.abandonment import (
    process_abandoned_tryon_followups,
    user_purchased_after_tryon,
)


def _make_image(name: str = "photo.jpg") -> SimpleUploadedFile:
    buffer = io.BytesIO()
    Image.new("RGB", (400, 600), color=(180, 160, 140)).save(buffer, format="JPEG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/jpeg")


@pytest.fixture
def customer(db):
    return User.objects.create_user(
        email="abandon@example.com",
        username="abandon",
        password="testpass123",
        first_name="Lead",
    )


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        email="staff@example.com",
        username="staff",
        password="testpass123",
        is_staff=True,
    )


@pytest.fixture
def product(db):
    category = Category.objects.create(name="Suits", slug="suits")
    product = Product.objects.create(
        name="Lawn Suit",
        slug="lawn-suit",
        description="Summer suit",
        category=category,
        is_active=True,
    )
    ProductVariant.objects.create(
        product=product,
        sku="LS-M",
        price="89.00",
        color="Blue",
        size="M",
        stock_quantity=10,
    )
    return product


@pytest.fixture
def completed_job(customer, product):
    variant = product.variants.first()
    completed_at = timezone.now() - timedelta(seconds=90000)
    return TryOnJob.objects.create(
        user=customer,
        product=product,
        variant=variant,
        user_photo=_make_image(),
        status=TryOnJob.Status.COMPLETED,
        consent_given=True,
        provider="demo",
        completed_at=completed_at,
    )


@pytest.mark.django_db
def test_abandonment_skips_recent_tryons(customer, product):
    TryOnJob.objects.create(
        user=customer,
        product=product,
        user_photo=_make_image(),
        status=TryOnJob.Status.COMPLETED,
        consent_given=True,
        provider="demo",
        completed_at=timezone.now() - timedelta(seconds=7200),
    )
    assert process_abandoned_tryon_followups() == 0


@pytest.mark.django_db
@patch("apps.tryon.services.abandonment.get_email_backend")
def test_abandonment_sends_customer_and_staff_alerts(
    mock_get_backend, completed_job, staff_user
):
    backend = MagicMock()
    mock_get_backend.return_value = backend

    assert process_abandoned_tryon_followups() == 1

    completed_job.refresh_from_db()
    assert completed_job.abandonment_followup_sent_at is not None
    backend.send_tryon_abandoned_followup.assert_called_once()
    backend.send_tryon_abandoned_staff_alert.assert_called_once()

    assert Notification.objects.filter(
        user=completed_job.user,
        event_type=Notification.EventType.TRYON_ABANDONED,
    ).exists()
    assert Notification.objects.filter(
        user=staff_user,
        event_type=Notification.EventType.TRYON_ABANDONED_STAFF,
    ).exists()


@pytest.mark.django_db
@patch("apps.tryon.services.abandonment.get_email_backend")
def test_abandonment_skips_when_purchased(mock_get_backend, completed_job, customer, product):
    variant = product.variants.first()
    address = Address.objects.create(
        user=customer,
        label="Home",
        line1="12 Main St",
        city="Karachi",
        postal_code="75500",
        country="PK",
    )
    order = Order.objects.create(
        user=customer,
        shipping_address=address,
        status=Order.Status.CONFIRMED,
        total="89.00",
    )
    Payment.objects.create(order=order, status=Payment.Status.PAID, amount="89.00")
    OrderItem.objects.create(
        order=order,
        product_name=product.name,
        variant_sku=variant.sku,
        color=variant.color,
        quantity=1,
        unit_price=variant.price,
    )
    order.created_at = completed_job.completed_at + timedelta(hours=1)
    Order.objects.filter(pk=order.pk).update(created_at=order.created_at)

    assert user_purchased_after_tryon(completed_job) is True
    assert process_abandoned_tryon_followups() == 0


@pytest.mark.django_db
def test_abandonment_skips_when_csr_exists(completed_job, customer):
    CSRHandoff.objects.create(
        tryon_job=completed_job,
        user=customer,
        message="Need help with sizing",
        contact_email=customer.email,
    )
    assert process_abandoned_tryon_followups() == 0
