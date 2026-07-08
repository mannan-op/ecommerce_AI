from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.routers import DefaultRouter

from apps.accounts.views import (
    AddressViewSet,
    CurrentUserView,
    EmailTokenObtainPairView,
    PasswordResetRequestView,
    RegisterView,
    ThrottledTokenRefreshView,
)
from apps.cart.views import CartViewSet
from apps.catalog.admin_views import (
    AdminCategoryViewSet,
    AdminProductImageViewSet,
    AdminProductViewSet,
    AdminVariantViewSet,
)
from apps.catalog.views import CategoryViewSet, ProductViewSet
from apps.orders.views import OrderViewSet
from apps.tryon.views import AdminCSRHandoffViewSet, CSRHandoffViewSet, TryOnJobViewSet

router = DefaultRouter()
router.register("catalog/categories", CategoryViewSet, basename="category")
router.register("catalog/products", ProductViewSet, basename="product")
router.register("cart", CartViewSet, basename="cart")
router.register("orders", OrderViewSet, basename="order")
router.register("accounts/addresses", AddressViewSet, basename="address")
router.register("admin/catalog/categories", AdminCategoryViewSet, basename="admin-category")
router.register("admin/catalog/products", AdminProductViewSet, basename="admin-product")
router.register("admin/catalog/variants", AdminVariantViewSet, basename="admin-variant")
router.register("admin/catalog/images", AdminProductImageViewSet, basename="admin-image")
router.register("tryon/jobs", TryOnJobViewSet, basename="tryon-job")
router.register("tryon/csr", CSRHandoffViewSet, basename="tryon-csr")
router.register("admin/tryon/csr", AdminCSRHandoffViewSet, basename="admin-tryon-csr")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path("api/auth/token/", EmailTokenObtainPairView.as_view(), name="token_obtain"),
    path(
        "api/auth/token/refresh/",
        ThrottledTokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("api/accounts/register/", RegisterView.as_view(), name="register"),
    path(
        "api/accounts/password-reset/",
        PasswordResetRequestView.as_view(),
        name="password-reset",
    ),
    path("api/accounts/me/", CurrentUserView.as_view(), name="current-user"),
    path("api/", include(router.urls)),
]
