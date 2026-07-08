from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.cart.models import CartItem
from apps.cart.serializers import (
    AddCartItemSerializer,
    CartItemSerializer,
    CartSerializer,
    UpdateCartItemSerializer,
)
from apps.cart.services import get_cart_for_request, merge_session_cart_into_user
from apps.common.exceptions import BusinessError


@extend_schema_view(
    list=extend_schema(summary="Get current cart", responses=CartSerializer),
    add_item=extend_schema(
        summary="Add item to cart",
        request=AddCartItemSerializer,
        responses=CartItemSerializer,
    ),
    update_item=extend_schema(
        summary="Update cart item quantity",
        request=UpdateCartItemSerializer,
        responses=CartItemSerializer,
    ),
    remove_item=extend_schema(summary="Remove item from cart", responses=None),
    clear=extend_schema(summary="Clear cart", responses=None),
    merge=extend_schema(
        summary="Merge session cart into user cart", responses=CartSerializer
    ),
)
class CartViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = CartSerializer

    def list(self, request):
        cart = get_cart_for_request(request)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"], url_path="items")
    def add_item(self, request):
        serializer = AddCartItemSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        variant = serializer.context["variant"]
        quantity = serializer.validated_data["quantity"]
        cart = get_cart_for_request(request)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            variant=variant,
            defaults={"quantity": quantity},
        )
        if not created:
            new_qty = item.quantity + quantity
            if new_qty > variant.stock_quantity:
                raise BusinessError(
                    f"Only {variant.stock_quantity} items available in stock.",
                    code="INSUFFICIENT_STOCK",
                )
            item.quantity = new_qty
            item.save()

        return Response(
            CartItemSerializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"], url_path=r"items/(?P<item_id>[^/.]+)")
    def update_item(self, request, item_id=None):
        cart = get_cart_for_request(request)
        try:
            item = CartItem.objects.select_related("variant").get(pk=item_id, cart=cart)
        except CartItem.DoesNotExist as exc:
            raise BusinessError(
                "Item not found.", code="NOT_FOUND", status_code=404
            ) from exc

        serializer = UpdateCartItemSerializer(
            data=request.data, context={"cart_item": item}
        )
        serializer.is_valid(raise_exception=True)

        item.quantity = serializer.validated_data["quantity"]
        item.save()
        return Response(CartItemSerializer(item).data)

    @action(detail=False, methods=["delete"], url_path=r"items/(?P<item_id>[^/.]+)")
    def remove_item(self, request, item_id=None):
        cart = get_cart_for_request(request)
        deleted, _ = CartItem.objects.filter(pk=item_id, cart=cart).delete()
        if not deleted:
            raise BusinessError(
                "Item not found.", code="NOT_FOUND", status_code=404
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["delete"], url_path="clear")
    def clear(self, request):
        cart = get_cart_for_request(request)
        cart.items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["post"],
        url_path="merge",
        permission_classes=[IsAuthenticated],
    )
    def merge(self, request):
        session_key = request.data.get("session_key") or request.session.session_key
        cart = merge_session_cart_into_user(session_key, request.user)
        return Response(CartSerializer(cart).data)
