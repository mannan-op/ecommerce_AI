import re

from rest_framework import serializers

from apps.accounts.models import Address, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "is_active",
        )
        read_only_fields = ("id", "email", "is_active")


class StaffUserSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ("is_staff",)
        read_only_fields = ("id", "email", "is_active", "is_staff")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name", "phone")

    def create(self, validated_data):
        password = validated_data.pop("password")
        email = validated_data.pop("email")
        return User.objects.create_user(
            username=email,
            email=email,
            password=password,
            **validated_data,
        )


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id",
            "label",
            "line1",
            "line2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_line1(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "Address line must be at least 3 characters."
            )
        return value.strip()

    def validate_city(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("City is required.")
        return value.strip()

    def validate_postal_code(self, value):
        cleaned = value.strip()
        if not re.match(r"^[\w\s\-]{3,12}$", cleaned):
            raise serializers.ValidationError("Enter a valid postal code.")
        return cleaned

    def validate_country(self, value):
        if len(value) != 2:
            raise serializers.ValidationError(
                "Use a 2-letter country code (e.g. PK, US)."
            )
        return value.upper()

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
