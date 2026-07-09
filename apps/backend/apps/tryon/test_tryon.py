import io
from unittest.mock import MagicMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Category, Product, ProductImage, ProductVariant
from apps.tryon.models import CSRHandoff, TryOnJob


def _make_image(name: str = "photo.jpg") -> SimpleUploadedFile:
    buffer = io.BytesIO()
    Image.new("RGB", (400, 600), color=(180, 160, 140)).save(buffer, format="JPEG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/jpeg")


@pytest.fixture
def customer(db):
    return User.objects.create_user(
        email="tryon@example.com",
        username="tryon",
        password="testpass123",
        first_name="Try",
        last_name="On",
    )


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        email="stylist@example.com",
        username="stylist",
        password="testpass123",
        is_staff=True,
    )


@pytest.fixture
def product(db):
    category = Category.objects.create(name="Dresses", slug="dresses")
    product = Product.objects.create(
        name="Silk Gown",
        slug="silk-gown",
        description="Evening wear",
        category=category,
        is_active=True,
    )
    ProductVariant.objects.create(
        product=product,
        sku="SG-M",
        price="199.00",
        color="Ivory",
        size="M",
        stock_quantity=5,
    )
    image = _make_image("garment.jpg")
    ProductImage.objects.create(
        product=product,
        image=image,
        alt_text="Ivory front",
        is_primary=True,
        sort_order=0,
    )
    return product


@pytest.mark.django_db
def test_create_tryon_job_completes_in_demo_mode(customer, product):
    client = APIClient()
    client.force_authenticate(user=customer)

    response = client.post(
        "/api/tryon/jobs/",
        {
            "product": str(product.id),
            "user_photo": _make_image(),
            "consent_given": "true",
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_201_CREATED
    job_id = response.data["id"]
    job = TryOnJob.objects.get(id=job_id)
    assert job.status == TryOnJob.Status.COMPLETED
    assert job.result_image
    assert job.consent_given is True


@pytest.mark.django_db
def test_tryon_requires_consent(customer, product):
    client = APIClient()
    client.force_authenticate(user=customer)

    response = client.post(
        "/api/tryon/jobs/",
        {
            "product": str(product.id),
            "user_photo": _make_image(),
            "consent_given": "false",
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_csr_handoff_after_tryon(customer, product):
    client = APIClient()
    client.force_authenticate(user=customer)

    job_response = client.post(
        "/api/tryon/jobs/",
        {
            "product": str(product.id),
            "user_photo": _make_image(),
            "consent_given": "true",
        },
        format="multipart",
    )
    job_id = job_response.data["id"]

    csr_response = client.post(
        "/api/tryon/csr/",
        {
            "tryon_job_id": job_id,
            "message": "Need sizing advice for an event.",
            "contact_email": customer.email,
            "preferred_channel": "email",
        },
        format="json",
    )

    assert csr_response.status_code == status.HTTP_201_CREATED
    assert CSRHandoff.objects.filter(user=customer).count() == 1


@pytest.mark.django_db
def test_admin_csr_queue(staff_user, customer, product):
    client = APIClient()
    client.force_authenticate(user=customer)
    job = TryOnJob.objects.create(
        user=customer,
        product=product,
        user_photo=_make_image(),
        status=TryOnJob.Status.COMPLETED,
        consent_given=True,
        provider="demo",
    )
    CSRHandoff.objects.create(
        tryon_job=job,
        user=customer,
        message="Help me choose",
        contact_email=customer.email,
        preferred_channel=CSRHandoff.Channel.EMAIL,
    )

    admin = APIClient()
    admin.force_authenticate(user=staff_user)
    response = admin.get("/api/admin/tryon/csr/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1

    handoff_id = response.data["results"][0]["id"]
    patch = admin.patch(
        f"/api/admin/tryon/csr/{handoff_id}/",
        {"status": "contacted", "staff_notes": "Emailed styling guide."},
        format="json",
    )
    assert patch.status_code == status.HTTP_200_OK
    assert patch.data["status"] == "contacted"


@pytest.mark.django_db
@patch("apps.tryon.services.stylist_chat.settings.GROQ_API_KEY", "test-groq-key")
@patch("apps.tryon.services.stylist_chat.urllib.request.urlopen")
def test_stylist_chat_on_tryon_job(mock_urlopen, customer, product):
    mock_response = MagicMock()
    mock_response.read.return_value = (
        b'{"choices":[{"message":{"content":"Pair with nude heels for an elegant look."}}]}'
    )
    mock_response.__enter__.return_value = mock_response
    mock_urlopen.return_value = mock_response

    job = TryOnJob.objects.create(
        user=customer,
        product=product,
        user_photo=_make_image(),
        status=TryOnJob.Status.COMPLETED,
        consent_given=True,
        provider="demo",
    )

    client = APIClient()
    client.force_authenticate(user=customer)
    response = client.post(
        f"/api/tryon/jobs/{job.id}/stylist-chat/",
        {
            "message": "What shoes go with this?",
            "history": [],
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert "nude heels" in response.data["reply"].lower()


@pytest.mark.django_db
def test_tryon_config_includes_stylist_flags(customer):
    client = APIClient()
    response = client.get("/api/tryon/jobs/config/")

    assert response.status_code == status.HTTP_200_OK
    assert "stylist_chat_enabled" in response.data
