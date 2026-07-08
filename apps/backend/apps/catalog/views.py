from django.db.models import Min, Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import AllowAny

from apps.catalog.filters import ProductFilter
from apps.catalog.models import Category, Product, ProductImage, ProductVariant
from apps.catalog.serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "description"]

    def get_queryset(self):
        qs = (
            Product.objects.filter(is_active=True).select_related("category").distinct()
        )
        if self.action == "retrieve":
            return qs.prefetch_related(
                Prefetch(
                    "variants",
                    queryset=ProductVariant.objects.filter(is_active=True),
                ),
                Prefetch(
                    "images",
                    queryset=ProductImage.objects.order_by("sort_order"),
                ),
            )
        return qs.annotate(price_min=Min("variants__price")).order_by("name")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer
