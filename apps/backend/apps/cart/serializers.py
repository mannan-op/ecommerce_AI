from rest_framework import serializers

from apps.cart.models import Cart, CartItem
from apps.catalog.models import ProductVariant
from apps.catalog.serializers import ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    variant = ProductVariantSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "variant", "quantity", "subtotal")
        read_only_fields = ("id", "subtotal")


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ("id", "items", "total")
        read_only_fields = fields


class AddCartItemSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_variant_id(self, value):
        try:
            variant = ProductVariant.objects.select_related("product").get(
                pk=value, is_active=True, product__is_active=True
            )
        except ProductVariant.DoesNotExist as exc:
            raise serializers.ValidationError("Variant not found.") from exc
        self.context["variant"] = variant
        return value

    def validate(self, attrs):
        variant = self.context["variant"]
        quantity = attrs.get("quantity", 1)
        if quantity > variant.stock_quantity:
            raise serializers.ValidationError(
                {
                    "quantity": [
                        f"Only {variant.stock_quantity} items available in stock."
                    ]
                }
            )
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        item = self.context.get("cart_item")
        if item and value > item.variant.stock_quantity:
            raise serializers.ValidationError(
                f"Only {item.variant.stock_quantity} items available in stock."
            )
        return value
