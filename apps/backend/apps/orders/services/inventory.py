from django.db import transaction

from apps.catalog.models import ProductVariant
from apps.common.exceptions import BusinessError


def validate_cart_stock(cart_items) -> None:
    for item in cart_items:
        variant = item.variant
        if item.quantity > variant.stock_quantity:
            raise BusinessError(
                f"Insufficient stock for {variant.product.name} ({variant.sku}). "
                f"Only {variant.stock_quantity} available.",
                code="INSUFFICIENT_STOCK",
            )


@transaction.atomic
def reduce_stock_for_order(order) -> None:
    for order_item in order.items.all():
        try:
            variant = ProductVariant.objects.select_for_update().get(
                sku=order_item.variant_sku
            )
        except ProductVariant.DoesNotExist:
            continue

        if variant.stock_quantity < order_item.quantity:
            raise BusinessError(
                f"Insufficient stock for {order_item.product_name}.",
                code="INSUFFICIENT_STOCK",
            )

        variant.stock_quantity -= order_item.quantity
        variant.save(update_fields=["stock_quantity", "updated_at"])
