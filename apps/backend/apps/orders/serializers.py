from rest_framework import serializers

from apps.accounts.models import Address
from apps.accounts.serializers import AddressSerializer
from apps.orders.models import Order, OrderItem, Payment
from apps.orders.payments.factory import PROVIDERS


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id",
            "status",
            "amount",
            "provider",
            "provider_reference",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product_name",
            "variant_sku",
            "fabric_type",
            "color",
            "size",
            "quantity",
            "unit_price",
        )
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    shipping_address = AddressSerializer(read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "subtotal",
            "shipping_cost",
            "tax",
            "discount",
            "total",
            "shipping_address",
            "items",
            "payment",
            "estimated_delivery",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class CheckoutPreviewSerializer(serializers.Serializer):
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2)
    shipping_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    tax = serializers.DecimalField(max_digits=12, decimal_places=2)
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    items = serializers.ListField(child=serializers.DictField())


class CheckoutCreateSerializer(serializers.Serializer):
    shipping_address_id = serializers.UUIDField()
    idempotency_key = serializers.CharField(max_length=64)
    payment_provider = serializers.CharField(max_length=50, required=False)

    def validate_payment_provider(self, value):
        if value and value not in PROVIDERS:
            raise serializers.ValidationError(f"Unknown provider: {value}")
        return value

    def validate_shipping_address_id(self, value):
        user = self.context["request"].user
        try:
            address = Address.objects.get(pk=value, user=user)
        except Address.DoesNotExist as exc:
            raise serializers.ValidationError("Address not found.") from exc
        self.context["address"] = address
        return value


class PaymentConfirmSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    provider_reference = serializers.CharField(max_length=255)
