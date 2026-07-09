from django.db import transaction
from django.http import HttpRequest

from apps.cart.models import Cart, CartItem
from apps.orders.services.inventory import validate_cart_stock


def get_cart_for_request(request: HttpRequest) -> Cart:
    """Return the cart for an authenticated user or anonymous session."""
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart

    if not request.session.session_key:
        request.session.create()

    cart, _ = Cart.objects.get_or_create(
        session_key=request.session.session_key,
        defaults={"user": None},
    )
    return cart


@transaction.atomic
def merge_session_cart_into_user(session_key: str | None, user) -> Cart:
    """Merge anonymous session cart into the authenticated user's cart."""
    user_cart, _ = Cart.objects.get_or_create(user=user)

    if not session_key:
        return user_cart

    session_cart = Cart.objects.filter(
        session_key=session_key, user__isnull=True
    ).first()
    if not session_cart:
        return user_cart

    for item in session_cart.items.select_related("variant"):
        existing = CartItem.objects.filter(cart=user_cart, variant=item.variant).first()
        if existing:
            existing.quantity += item.quantity
            existing.save(update_fields=["quantity", "updated_at"])
        else:
            CartItem.objects.create(
                cart=user_cart,
                variant=item.variant,
                quantity=item.quantity,
            )

    session_cart.items.all().delete()
    session_cart.delete()

    merged_items = list(user_cart.items.select_related("variant", "variant__product"))
    if merged_items:
        validate_cart_stock(merged_items)

    return user_cart
