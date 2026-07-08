from decimal import Decimal

from django.conf import settings

from apps.cart.models import CartItem


def calculate_order_totals(cart_items: list[CartItem]) -> dict[str, Decimal]:
    subtotal = sum((item.subtotal for item in cart_items), Decimal("0.00"))
    discount = Decimal("0.00")

    shipping_flat = Decimal(str(getattr(settings, "SHIPPING_FLAT_RATE", "9.99")))
    free_threshold = Decimal(str(getattr(settings, "FREE_SHIPPING_THRESHOLD", "75.00")))
    shipping = Decimal("0.00") if subtotal >= free_threshold else shipping_flat

    tax_rate = Decimal(str(getattr(settings, "TAX_RATE", "0.05")))
    taxable = subtotal - discount + shipping
    tax = (taxable * tax_rate).quantize(Decimal("0.01"))

    total = subtotal - discount + shipping + tax

    return {
        "subtotal": subtotal.quantize(Decimal("0.01")),
        "discount": discount,
        "shipping_cost": shipping.quantize(Decimal("0.01")),
        "tax": tax,
        "total": total.quantize(Decimal("0.01")),
    }
