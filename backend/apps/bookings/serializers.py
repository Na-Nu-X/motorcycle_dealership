from django.conf import settings
from django.utils.translation import gettext as _
from rest_framework import serializers

from apps.catalog.models import Motorcycle
from apps.core.serializers import GdprConsentMixin, HoneypotSerializerMixin
from apps.core.validators import validate_booking_slot

from .models import BookingStatus, ServiceBooking, TestRideBooking

# Which licence groups are allowed to ride a bike requiring a given group.
LICENSE_ALLOWS = {
    "AM": {"A1", "A2", "A"},
    "A1": {"A1", "A2", "A"},
    "A2": {"A2", "A"},
    "A": {"A"},
}

ACTIVE_STATUSES = [BookingStatus.NEW, BookingStatus.CONFIRMED]


class ServiceBookingSerializer(HoneypotSerializerMixin, GdprConsentMixin, serializers.ModelSerializer):
    class Meta:
        model = ServiceBooking
        fields = [
            "id", "first_name", "last_name", "email", "phone", "motorcycle_model", "motorcycle_year",
            "mileage_km", "license_plate", "service_type", "preferred_date", "preferred_time", "note",
            "gdpr_consent", "website", "status",
        ]
        read_only_fields = ["id", "status"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        validate_booking_slot(attrs["preferred_date"], attrs["preferred_time"])
        taken = ServiceBooking.objects.filter(
            preferred_date=attrs["preferred_date"],
            preferred_time=attrs["preferred_time"],
            status__in=ACTIVE_STATUSES,
        ).count()
        if taken >= settings.SERVICE_SLOT_CAPACITY:
            raise serializers.ValidationError(
                {"preferred_time": _("Tento termín je už obsadený. Vyberte prosím iný čas.")}
            )
        return attrs


class TestRideBookingSerializer(HoneypotSerializerMixin, GdprConsentMixin, serializers.ModelSerializer):
    motorcycle = serializers.SlugRelatedField(
        slug_field="slug", queryset=Motorcycle.objects.filter(available=True).select_related("brand")
    )

    class Meta:
        model = TestRideBooking
        fields = [
            "id", "first_name", "last_name", "email", "phone", "motorcycle", "preferred_date", "preferred_time",
            "license_category", "license_confirmed", "riding_experience_years", "note", "gdpr_consent",
            "website", "status",
        ]
        read_only_fields = ["id", "status"]

    def validate_license_confirmed(self, value):
        if not value:
            raise serializers.ValidationError(
                _("Testovacia jazda je možná len s platným vodičským oprávnením.")
            )
        return value

    def validate_motorcycle(self, bike: Motorcycle):
        if bike.stock_status == Motorcycle.StockStatus.SOLD:
            raise serializers.ValidationError(_("Tento motocykel už bol predaný."))
        return bike

    def validate(self, attrs):
        attrs = super().validate(attrs)
        bike: Motorcycle = attrs["motorcycle"]
        if attrs["license_category"] not in LICENSE_ALLOWS.get(bike.license_category, {"A"}):
            raise serializers.ValidationError(
                {"license_category": _("Na tento motocykel je potrebné vodičské oprávnenie skupiny %s.")
                 % bike.license_category}
            )
        validate_booking_slot(attrs["preferred_date"], attrs["preferred_time"])
        if TestRideBooking.objects.filter(
            motorcycle=bike,
            preferred_date=attrs["preferred_date"],
            preferred_time=attrs["preferred_time"],
            status__in=ACTIVE_STATUSES,
        ).exists():
            raise serializers.ValidationError(
                {"preferred_time": _("Tento motocykel je v zvolenom čase už rezervovaný.")}
            )
        return attrs
