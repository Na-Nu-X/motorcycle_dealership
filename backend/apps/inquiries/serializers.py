from rest_framework import serializers

from apps.catalog.models import Motorcycle
from apps.core.serializers import GdprConsentMixin, HoneypotSerializerMixin

from .models import ContactMessage, VehicleInquiry


class VehicleInquirySerializer(HoneypotSerializerMixin, GdprConsentMixin, serializers.ModelSerializer):
    motorcycle = serializers.SlugRelatedField(slug_field="slug", queryset=Motorcycle.objects.filter(available=True))

    class Meta:
        model = VehicleInquiry
        fields = ["id", "first_name", "last_name", "email", "phone", "motorcycle", "inquiry_type", "message",
                  "gdpr_consent", "website"]
        read_only_fields = ["id"]


class ContactMessageSerializer(HoneypotSerializerMixin, GdprConsentMixin, serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "phone", "subject", "message", "gdpr_consent", "website"]
        read_only_fields = ["id"]
        extra_kwargs = {"message": {"min_length": 10, "max_length": 5000}}
