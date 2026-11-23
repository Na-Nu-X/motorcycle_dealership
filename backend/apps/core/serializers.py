from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

HONEYPOT_FIELD = "website"


class HoneypotSerializerMixin(serializers.Serializer):
    """Adds an invisible ``website`` field. Humans leave it empty, bots fill it.

    Any non-empty value makes the submission invalid. The field is never stored.
    """

    website = serializers.CharField(required=False, allow_blank=True, write_only=True, max_length=200)

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError(_("Požiadavka bola vyhodnotená ako spam."))
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        attrs.pop(HONEYPOT_FIELD, None)
        return attrs


class GdprConsentMixin(serializers.Serializer):
    def validate_gdpr_consent(self, value):
        if not value:
            raise serializers.ValidationError(_("Pre odoslanie je potrebný súhlas so spracovaním osobných údajov."))
        return value
