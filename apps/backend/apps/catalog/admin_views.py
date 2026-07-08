from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, parsers, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.catalog.admin_serializers import (
    AdminCategorySerializer,
    AdminProductDetailSerializer,
    AdminProductImageSerializer,
    AdminProductListSerializer,
    AdminProductWriteSerializer,
    AdminVariantSerializer,
)
from apps.catalog.filters import ProductFilter
from apps.catalog.models import Category, Product, ProductImage, ProductVariant
from apps.common.permissions import IsStaffUser


class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAuthenticated, IsStaffUser]
    lookup_field = "id"


class AdminProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    lookup_field = "id"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "description", "variants__sku"]

    def get_queryset(self):
        return (
            Product.objects.select_related("category")
            .prefetch_related("variants", "images")
            .annotate(
                variant_count=Count("variants", distinct=True),
                image_count=Count("images", distinct=True),
            )
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AdminProductDetailSerializer
        if self.action in ("create", "update", "partial_update"):
            return AdminProductWriteSerializer
        return AdminProductListSerializer


class AdminVariantViewSet(viewsets.ModelViewSet):
    serializer_class = AdminVariantSerializer
    permission_classes = [IsAuthenticated, IsStaffUser]
    lookup_field = "id"
    filterset_fields = ["product"]

    def get_queryset(self):
        return ProductVariant.objects.select_related("product").order_by("sku")


class AdminProductImageViewSet(viewsets.ModelViewSet):
    serializer_class = AdminProductImageSerializer
    permission_classes = [IsAuthenticated, IsStaffUser]
    lookup_field = "id"
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filterset_fields = ["product"]

    def get_queryset(self):
        return ProductImage.objects.select_related("product").order_by(
            "sort_order", "created_at"
        )
