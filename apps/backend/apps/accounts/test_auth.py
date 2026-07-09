from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="auth@example.com",
            username="auth@example.com",
            password="password123",
        )

    def test_login_returns_tokens(self):
        response = self.client.post(
            "/api/auth/token/",
            {"email": "auth@example.com", "password": "password123"},
            format="json",
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_refresh_rotates_and_blacklists_old_token(self):
        login = self.client.post(
            "/api/auth/token/",
            {"email": "auth@example.com", "password": "password123"},
            format="json",
        )
        old_refresh = login.data["refresh"]
        refresh = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": old_refresh},
            format="json",
        )
        assert refresh.status_code == 200
        assert "access" in refresh.data
        assert refresh.data.get("refresh")
        assert refresh.data["refresh"] != old_refresh

        reuse = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": old_refresh},
            format="json",
        )
        assert reuse.status_code == 401

    def test_me_hides_is_staff_for_customers(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/accounts/me/")
        assert response.status_code == 200
        assert "is_staff" not in response.data

    def test_register_creates_account(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "email": "new@example.com",
                "password": "password123",
                "first_name": "New",
            },
            format="json",
        )
        assert response.status_code == 201
        assert User.objects.filter(email="new@example.com").exists()
