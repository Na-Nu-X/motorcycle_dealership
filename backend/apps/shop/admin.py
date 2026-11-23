from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import ChoicesCheckboxFilter, RangeDateFilter, RangeNumericFilter
from unfold.decorators import display

from apps.core.admin_mixins import StatusActionsMixin, make_status_action

from .models import Accessory, Order, OrderItem


@admin.register(Accessory)
class AccessoryAdmin(ModelAdmin):
    list_display = ["thumbnail", "name", "brand", "category_label", "price", "stock_display", "active", "featured"]
    list_display_links = ["thumbnail", "name"]
    list_editable = ["active", "featured"]
    list_filter = [("category", ChoicesCheckboxFilter), ("price", RangeNumericFilter), "active", "featured"]
    list_filter_submit = True
    search_fields = ["name", "brand", "sku"]
    prepopulated_fields = {"slug": ["name"]}
    compressed_fields = True
    fieldsets = [
        (_("Produkt"), {"fields": [("name", "brand"), ("slug", "sku"), "category", "short_description", "description", "image"]}),
        (_("Cena a sklad"), {"fields": [("price", "previous_price"), "stock", ("sizes", "colors"), ("active", "featured")]}),
    ]

    @display(description="", image=True)
    def thumbnail(self, obj):
        return obj.image.url if obj.image else None

    @display(description=_("Kategória"), ordering="category", label=True)
    def category_label(self, obj):
        return obj.get_category_display()

    @display(description=_("Sklad"), ordering="stock", label={"0": "danger"})
    def stock_display(self, obj):
        return str(obj.stock)


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    fields = ["accessory", "name", "size", "color", "quantity", "unit_price"]
    autocomplete_fields = ["accessory"]


@admin.register(Order)
class OrderAdmin(StatusActionsMixin, ModelAdmin):
    list_display = ["number", "customer", "delivery_method", "total", "status_label", "created_at"]
    list_filter = [("status", ChoicesCheckboxFilter), "delivery_method", ("created_at", RangeDateFilter)]
    list_filter_submit = True
    search_fields = ["number", "first_name", "last_name", "email", "phone"]
    readonly_fields = ["number", "total", "created_at", "updated_at", "gdpr_consent"]
    inlines = [OrderItemInline]
    date_hierarchy = "created_at"
    actions = [make_status_action(s, s.label) for s in (Order.Status.CONFIRMED, Order.Status.READY,
                                                          Order.Status.COMPLETED, Order.Status.CANCELLED)]
    fieldsets = [
        (_("Objednávka"), {"fields": [("number", "status"), ("total", "shipping_price"), "delivery_method", "note"]}),
        (_("Zákazník"), {"fields": [("first_name", "last_name"), ("email", "phone"), ("street", "city", "postal_code"),
                                     "gdpr_consent"]}),
        (_("Interné"), {"fields": ["internal_note", ("created_at", "updated_at")]}),
    ]

    @display(description=_("Zákazník"), header=True)
    def customer(self, obj):
        return [obj.customer_name, obj.email]

    @display(description=_("Stav"), ordering="status", label={
        Order.Status.NEW.label: "info", Order.Status.CONFIRMED.label: "warning", Order.Status.READY.label: "warning",
        Order.Status.COMPLETED.label: "success", Order.Status.CANCELLED.label: "danger",
    })
    def status_label(self, obj):
        return obj.get_status_display()

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        form.instance.recalculate_total()
