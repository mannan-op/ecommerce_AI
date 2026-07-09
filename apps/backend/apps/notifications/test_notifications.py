import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalog.models import Category, Product
from apps.notifications.models import Notification
from apps.notifications.services import notify, notify_tryon_completed
from apps.tryon.models import TryOnJob

User = get_user_model()


@pytest.fixture
def customer(db):
    return User.objects.create_user(
        email="notify@example.com",
        username="notify",
        password="testpass123",
    )


@pytest.fixture
def product(db):
    category = Category.objects.create(name="Kurta", slug="kurta-test")
    return Product.objects.create(
        name="Test Kurta",
        slug="test-kurta",
        description="Test",
        category=category,
        is_active=True,
    )


@pytest.mark.django_db
def test_notify_is_idempotent(customer):
    first = notify(
        user=customer,
        event_type=Notification.EventType.ORDER_CONFIRMED,
        title="Order confirmed",
        body="Done",
        dedupe_key="order.confirmed:abc",
    )
    second = notify(
        user=customer,
        event_type=Notification.EventType.ORDER_CONFIRMED,
        title="Order confirmed",
        body="Done",
        dedupe_key="order.confirmed:abc",
    )
    assert first is not None
    assert second is not None
    assert first.id == second.id
    assert Notification.objects.filter(user=customer).count() == 1


@pytest.mark.django_db
def test_notification_api_list_and_mark_read(customer):
    notify(
        user=customer,
        event_type=Notification.EventType.TRYON_COMPLETED,
        title="Try-on ready",
        body="See your look",
        action_url="/products/test",
    )
    client = APIClient()
    client.force_authenticate(user=customer)

    list_response = client.get("/api/notifications/")
    assert list_response.status_code == status.HTTP_200_OK
    assert list_response.data["count"] == 1

    count_response = client.get("/api/notifications/unread-count/")
    assert count_response.data["count"] == 1

    notification_id = list_response.data["results"][0]["id"]
    read_response = client.patch(f"/api/notifications/{notification_id}/read/")
    assert read_response.status_code == status.HTTP_200_OK
    assert read_response.data["is_read"] is True

    count_after = client.get("/api/notifications/unread-count/")
    assert count_after.data["count"] == 0


@pytest.mark.django_db
def test_tryon_completed_creates_notification(customer, product):
    job = TryOnJob.objects.create(
        user=customer,
        product=product,
        status=TryOnJob.Status.COMPLETED,
        consent_given=True,
        provider="demo",
    )
    notify_tryon_completed(job)
    assert Notification.objects.filter(
        user=customer,
        event_type=Notification.EventType.TRYON_COMPLETED,
    ).exists()
