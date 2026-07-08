from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.models import User


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Accept `email` + `password` for JWT login (USERNAME_FIELD is email)."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field] = serializers.EmailField()
        self.fields[self.username_field].label = "Email"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        return token

    def validate(self, attrs):
        email = attrs.get(self.username_field)
        if email:
            attrs[self.username_field] = User.objects.normalize_email(email)
        return super().validate(attrs)
