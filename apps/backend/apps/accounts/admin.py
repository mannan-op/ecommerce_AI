from django.contrib import admin

from apps.accounts.models import Address, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "first_name",
        "last_name",
        "phone",
        "is_active",
        "is_staff",
    )
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("user", "label", "line1", "city", "country", "is_default")
    list_filter = ("country", "is_default")
    search_fields = ("user__email", "line1", "city")
