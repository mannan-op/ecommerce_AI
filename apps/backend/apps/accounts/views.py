from drf_spectacular.utils import extend_schema
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.jwt_serializers import EmailTokenObtainPairSerializer
from apps.accounts.models import Address, User
from apps.accounts.serializers import (
    AddressSerializer,
    RegisterSerializer,
    StaffUserSerializer,
    UserSerializer,
)
from apps.cart.services import merge_session_cart_into_user
from apps.common.throttling import AuthAnonRateThrottle, AuthUserRateThrottle


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]


class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.is_staff:
            return StaffUserSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class PasswordResetRequestView(APIView):
    """Request a password reset email (always returns success for security)."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    @extend_schema(
        request=None,
        responses={
            200: {
                "type": "object",
                "properties": {"detail": {"type": "string"}},
            }
        },
    )
    def post(self, request):
        return Response(
            {
                "detail": (
                    "If an account with that email exists, "
                    "password reset instructions have been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class EmailTokenObtainPairView(TokenObtainPairView):
    """JWT token endpoint — authenticate with email + password."""

    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            session_key = (
                request.data.get("session_key") or request.session.session_key
            )
            email = request.data.get("email")
            if email:
                user = User.objects.filter(email=email).first()
                if user:
                    merge_session_cart_into_user(session_key, user)
        return response


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [AuthAnonRateThrottle, AuthUserRateThrottle]
