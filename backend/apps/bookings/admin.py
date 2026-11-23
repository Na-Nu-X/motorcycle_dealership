from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import ChoicesCheckboxFilter, RangeDateFilter
from unfold.decorators import display

from apps.core.admin_mixins import StatusActionsMixin, make_status_action

from .models import BookingStatus, ServiceBooking, TestRideBooking

STATUS_COLORS = {
    BookingStatus.NEW.label: "info",
    BookingStatus.CONFIRMED.label: "warning",
    BookingStatus.COMPLETED.label: "success",
    BookingStatus.CANCELLED.label: "danger",
}
STATUS_ACTIONS = [make_status_action(s, s.label) for s in
                  (BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.CANCELLED)]
CONTACT_FIELDS = (_("Zákazník"), {"fields": [("first_name", "last_name"), ("email", "phone"), "gdpr_consent"]})


class BookingAdminBase(StatusActionsMixin, ModelAdmin):
    list_filter_submit = True
    date_hierarchy = "preferred_date"
    readonly_fields = ["created_at", "updated_at", "gdpr_consent"]
    search_fields = ["first_name", "last_name", "email", "phone"]
    actions = STATUS_ACTIONS

    @display(description=_("Zákazník"), header=True)
    def customer(self, obj):
        return [obj.customer_name, obj.phone]

    @display(description=_("Termín"), ordering="preferred_date")
    def slot(self, obj):
        return f"{obj.preferred_date:%d.%m.%Y} {obj.preferred_time:%H:%M}"

    @display(description=_("Stav"), ordering="status", label=STATUS_COLORS)
    def status_label(self, obj):
        return obj.get_status_display()


@admin.register(ServiceBooking)
class ServiceBookingAdmin(BookingAdminBase):
    list_display = ["customer", "motorcycle_model", "service_type_label", "slot", "status_label", "created_at"]
    list_filter = [("status", ChoicesCheckboxFilter), ("service_type", ChoicesCheckboxFilter),
                   ("preferred_date", RangeDateFilter)]
    search_fields = BookingAdminBase.search_fields + ["motorcycle_model", "license_plate"]
    fieldsets = [
        (_("Zákazka"), {"fields": [("service_type", "status"), ("preferred_date", "preferred_time"), "note"]}),
        (_("Motocykel"), {"fields": ["motorcycle_model", ("motorcycle_year", "mileage_km", "license_plate")]}),
        CONTACT_FIELDS,
        (_("Interné"), {"fields": ["internal_note", ("created_at", "updated_at")]}),
    ]

    @display(description=_("Typ servisu"), ordering="service_type", label=True)
    def service_type_label(self, obj):
        return obj.get_service_type_display()


@admin.register(TestRideBooking)
class TestRideBookingAdmin(BookingAdminBase):
    list_display = ["customer", "motorcycle", "license_category", "license_confirmed", "slot", "status_label",
                    "created_at"]
    list_filter = [("status", ChoicesCheckboxFilter), "license_category", ("preferred_date", RangeDateFilter)]
    search_fields = BookingAdminBase.search_fields + ["motorcycle__model", "motorcycle__brand__name"]
    autocomplete_fields = ["motorcycle"]
    readonly_fields = BookingAdminBase.readonly_fields + ["license_confirmed"]
    fieldsets = [
        (_("Rezervácia"), {"fields": ["motorcycle", "status", ("preferred_date", "preferred_time"), "note"]}),
        (_("Vodič"), {"fields": [("license_category", "license_confirmed"), "riding_experience_years"]}),
        CONTACT_FIELDS,
        (_("Interné"), {"fields": ["internal_note", ("created_at", "updated_at")]}),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("motorcycle__brand")
