from rest_framework import serializers

from apps.catalog.models import Product, ProductVariant
from apps.tryon.models import CSRHandoff, TryOnJob


class TryOnJobCreateSerializer(serializers.ModelSerializer):
    consent_given = serializers.BooleanField(required=True)
    variant_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = TryOnJob
        fields = ["product", "variant_id", "user_photo", "consent_given"]

    def validate_consent_given(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError(
                "You must consent to photo processing for virtual try-on."
            )
        return value

    def validate_product(self, product: Product) -> Product:
        if not product.is_active:
            raise serializers.ValidationError("Product is not available for try-on.")
        return product

    def validate(self, attrs: dict) -> dict:
        variant_id = attrs.pop("variant_id", None)
        product = attrs["product"]
        if variant_id:
            try:
                variant = ProductVariant.objects.get(id=variant_id, product=product)
            except ProductVariant.DoesNotExist as exc:
                raise serializers.ValidationError(
                    {"variant_id": "Variant does not belong to this product."}
                ) from exc
            attrs["variant"] = variant
        return attrs

    def validate_user_photo(self, photo) -> object:
        max_bytes = 8 * 1024 * 1024
        if photo.size > max_bytes:
            raise serializers.ValidationError("Photo must be 8 MB or smaller.")
        content_type = getattr(photo, "content_type", "")
        if content_type and not content_type.startswith("image/"):
            raise serializers.ValidationError("Upload must be an image file.")
        return photo


class TryOnJobSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    variant_color = serializers.CharField(
        source="variant.color",
        read_only=True,
        allow_null=True,
    )
    result_image = serializers.ImageField(read_only=True)
    user_photo = serializers.ImageField(read_only=True)

    class Meta:
        model = TryOnJob
        fields = [
            "id",
            "product",
            "product_name",
            "product_slug",
            "variant",
            "variant_color",
            "status",
            "provider",
            "result_image",
            "user_photo",
            "error_message",
            "consent_given",
            "consent_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class CSRHandoffCreateSerializer(serializers.ModelSerializer):
    tryon_job_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = CSRHandoff
        fields = [
            "tryon_job_id",
            "message",
            "contact_email",
            "contact_phone",
            "preferred_channel",
        ]

    def validate_tryon_job_id(self, value):
        user = self.context["request"].user
        try:
            job = TryOnJob.objects.get(id=value, user=user)
        except TryOnJob.DoesNotExist as exc:
            raise serializers.ValidationError("Try-on job not found.") from exc
        return job

    def create(self, validated_data: dict) -> CSRHandoff:
        job = validated_data.pop("tryon_job_id")
        return CSRHandoff.objects.create(
            tryon_job=job,
            user=self.context["request"].user,
            **validated_data,
        )


class CSRHandoffSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="tryon_job.product.name",
        read_only=True,
    )
    tryon_status = serializers.CharField(
        source="tryon_job.status",
        read_only=True,
    )
    result_image = serializers.ImageField(
        source="tryon_job.result_image",
        read_only=True,
        allow_null=True,
    )
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = CSRHandoff
        fields = [
            "id",
            "tryon_job",
            "product_name",
            "tryon_status",
            "result_image",
            "message",
            "contact_email",
            "contact_phone",
            "preferred_channel",
            "status",
            "staff_notes",
            "assigned_to",
            "user_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "tryon_job",
            "product_name",
            "tryon_status",
            "result_image",
            "user_email",
            "created_at",
            "updated_at",
        ]


class AdminCSRHandoffSerializer(CSRHandoffSerializer):
    class Meta(CSRHandoffSerializer.Meta):
        read_only_fields = [
            "id",
            "tryon_job",
            "product_name",
            "tryon_status",
            "result_image",
            "user_email",
            "message",
            "contact_email",
            "contact_phone",
            "preferred_channel",
            "created_at",
            "updated_at",
        ]
