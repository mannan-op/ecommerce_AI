from django.contrib import admin

from apps.notifications.models import Notification
from apps.notifications.services import notify_order_status
from apps.orders.models import Order, OrderItem, Payment

ORDER_STATUS_NOTIFICATIONS = {
    Order.Status.SHIPPED: (
        Notification.EventType.ORDER_SHIPPED,
        "Order shipped",
        "Your order is on its way — track it in your order history.",
    ),
    Order.Status.DELIVERED: (
        Notification.EventType.ORDER_DELIVERED,
        "Order delivered",
        "Your order has been delivered. We hope you love it.",
    ),
    Order.Status.CANCELLED: (
        Notification.EventType.ORDER_CANCELLED,
        "Order cancelled",
        "Your order was cancelled. Contact us if you need help.",
    ),
}


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product_name",
        "variant_sku",
        "fabric_type",
        "color",
        "size",
        "quantity",
        "unit_price",
    )


class PaymentInline(admin.StackedInline):
    model = Payment
    extra = 0
    readonly_fields = (
        "status",
        "amount",
        "provider",
        "provider_reference",
        "created_at",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total", "created_at")
    list_filter = ("status",)
    search_fields = ("user__email", "id")
    inlines = [OrderItemInline, PaymentInline]

    def save_model(self, request, obj, form, change):
        previous_status = None
        if change and obj.pk:
            previous_status = (
                Order.objects.filter(pk=obj.pk)
                .values_list("status", flat=True)
                .first()
            )
        super().save_model(request, obj, form, change)
        if (
            change
            and previous_status
            and previous_status != obj.status
            and obj.status in ORDER_STATUS_NOTIFICATIONS
        ):
            event_type, title, body = ORDER_STATUS_NOTIFICATIONS[obj.status]
            notify_order_status(
                obj.user,
                obj,
                event_type=event_type,
                title=title,
                body=body,
            )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product_name", "variant_sku", "quantity", "unit_price")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "status", "amount", "provider", "created_at")
    list_filter = ("status", "provider")
    search_fields = ("provider_reference", "order__id")
