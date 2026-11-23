from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import ChoicesCheckboxFilter, RangeDateFilter
from unfold.decorators import display

from apps.core.admin_mixins import StatusActionsMixin, make_status_action

from .models import ContactMessage, InquiryStatus, VehicleInquiry

STATUS_COLORS = {
    InquiryStatus.NEW.label: "info",
    InquiryStatus.IN_PROGRESS.label: "warning",
    InquiryStatus.CLOSED.label: "success",
}
STATUS_ACTIONS = [make_status_action(s, s.label) for s in (InquiryStatus.IN_PROGRESS, InquiryStatus.CLOSED)]


@admin.register(VehicleInquiry)
class VehicleInquiryAdmin(StatusActionsMixin, ModelAdmin):
    list_display = ["customer", "motorcycle", "type_label", "status_label", "created_at"]
    list_filter = [("status", ChoicesCheckboxFilter), ("inquiry_type", ChoicesCheckboxFilter),
                   ("created_at", RangeDateFilter)]
    list_filter_submit = True
    search_fields = ["first_name", "last_name", "email", "phone", "motorcycle__model"]
    autocomplete_fields = ["motorcycle"]
    readonly_fields = ["created_at", "updated_at", "gdpr_consent"]
    actions = STATUS_ACTIONS
    fieldsets = [
        (_("Dopyt"), {"fields": [("motorcycle", "inquiry_type"), "status", "message"]}),
        (_("Zákazník"), {"fields": [("first_name", "last_name"), ("email", "phone"), "gdpr_consent"]}),
        (_("Interné"), {"fields": ["internal_note", ("created_at", "updated_at")]}),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("motorcycle__brand")

    @display(description=_("Zákazník"), header=True)
    def customer(self, obj):
        return [obj.customer_name, obj.email]

    @display(description=_("Typ"), ordering="inquiry_type", label=True)
    def type_label(self, obj):
        return obj.get_inquiry_type_display()

    @display(description=_("Stav"), ordering="status", label=STATUS_COLORS)
    def status_label(self, obj):
        return obj.get_status_display()


@admin.register(ContactMessage)
class ContactMessageAdmin(StatusActionsMixin, ModelAdmin):
    list_display = ["sender", "subject", "status_label", "created_at"]
    list_filter = [("status", ChoicesCheckboxFilter), ("created_at", RangeDateFilter)]
    list_filter_submit = True
    search_fields = ["name", "email", "subject", "message"]
    readonly_fields = ["name", "email", "phone", "subject", "message", "gdpr_consent", "created_at", "updated_at"]
    actions = STATUS_ACTIONS
    fieldsets = [
        (_("Správa"), {"fields": ["subject", "message", "status"]}),
        (_("Odosielateľ"), {"fields": [("name", "email", "phone"), "gdpr_consent"]}),
        (_("Interné"), {"fields": ["internal_note", ("created_at", "updated_at")]}),
    ]

    @display(description=_("Odosielateľ"), header=True)
    def sender(self, obj):
        return [obj.name, obj.email]

    @display(description=_("Stav"), ordering="status", label=STATUS_COLORS)
    def status_label(self, obj):
        return obj.get_status_display()
