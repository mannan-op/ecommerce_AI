from rest_framework import serializers

from apps.catalog.models import Category, Product, ProductImage, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "parent")
        read_only_fields = fields


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary", "sort_order")
        read_only_fields = fields


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "sku",
            "price",
            "fabric_type",
            "color",
            "size",
            "stock_quantity",
            "is_active",
        )
        read_only_fields = fields


class ProductListSerializer(serializers.ModelSerializer):
    min_price = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        ref_name = "ProductList"
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "category",
            "is_active",
            "min_price",
            "primary_image",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_min_price(self, obj: Product):
        annotated = getattr(obj, "price_min", None)
        if annotated is not None:
            return annotated
        return obj.min_price

    def get_primary_image(self, obj: Product) -> str | None:
        image = obj.images.filter(is_primary=True).first() or obj.images.first()
        if image:
            return image.image.url
        return None


class ProductDetailSerializer(ProductListSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        ref_name = "ProductDetail"
        fields = ProductListSerializer.Meta.fields + ("variants", "images")
