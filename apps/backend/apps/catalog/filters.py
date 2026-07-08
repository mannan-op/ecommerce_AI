import django_filters
from django.db.models import Min, Q

from apps.catalog.models import Product


class ProductFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    category = django_filters.CharFilter(field_name="category__slug")
    fabric = django_filters.CharFilter(
        field_name="variants__fabric_type", lookup_expr="iexact"
    )
    color = django_filters.CharFilter(
        field_name="variants__color", lookup_expr="iexact"
    )
    size = django_filters.CharFilter(field_name="variants__size", lookup_expr="iexact")
    min_price = django_filters.NumberFilter(method="filter_min_price")
    max_price = django_filters.NumberFilter(method="filter_max_price")
    ordering = django_filters.OrderingFilter(
        fields=(
            ("name", "name"),
            ("price_min", "price"),
            ("created_at", "newest"),
        )
    )

    class Meta:
        model = Product
        fields: list[str] = []

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value) | Q(description__icontains=value)
        )

    def filter_min_price(self, queryset, name, value):
        return queryset.annotate(price_min=Min("variants__price")).filter(
            price_min__gte=value
        )

    def filter_max_price(self, queryset, name, value):
        return queryset.annotate(price_min=Min("variants__price")).filter(
            price_min__lte=value
        )
