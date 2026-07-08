from rest_framework import serializers

from apps.catalog.models import Category, Product, ProductImage, ProductVariant
from apps.catalog.serializers import ProductImageSerializer, ProductVariantSerializer


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "parent")
        read_only_fields = ("id",)


class AdminProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    variant_count = serializers.IntegerField(read_only=True)
    image_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "category_name",
            "is_active",
            "variant_count",
            "image_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class AdminProductDetailSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "category",
            "category_name",
            "is_active",
            "variants",
            "images",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "variants", "images")


class AdminProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ("id", "name", "slug", "description", "category", "is_active")
        read_only_fields = ("id",)

    def validate_slug(self, value):
        qs = Product.objects.filter(slug=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this slug already exists.")
        return value


class AdminVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "product",
            "product_name",
            "sku",
            "price",
            "fabric_type",
            "color",
            "size",
            "stock_quantity",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_sku(self, value):
        qs = ProductVariant.objects.filter(sku=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This SKU is already in use.")
        return value


class AdminProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = (
            "id",
            "product",
            "image",
            "alt_text",
            "is_primary",
            "sort_order",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def to_internal_value(self, data):
        if hasattr(data, "get"):
            mutable = data.copy()
            if "is_primary" in mutable:
                raw = mutable.get("is_primary")
                if isinstance(raw, str):
                    mutable["is_primary"] = raw.lower() in ("true", "1", "on", "yes")
            if "sort_order" in mutable and isinstance(mutable.get("sort_order"), str):
                try:
                    mutable["sort_order"] = int(mutable["sort_order"])
                except ValueError:
                    pass
            data = mutable
        return super().to_internal_value(data)

    def create(self, validated_data):
        image = super().create(validated_data)
        if image.is_primary:
            ProductImage.objects.filter(product=image.product).exclude(
                pk=image.pk
            ).update(is_primary=False)
        return image

    def update(self, instance, validated_data):
        image = super().update(instance, validated_data)
        if image.is_primary:
            ProductImage.objects.filter(product=image.product).exclude(
                pk=image.pk
            ).update(is_primary=False)
        return image
