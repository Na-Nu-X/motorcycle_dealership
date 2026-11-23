from django.contrib import admin
from django.db import models
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import (
    ChoicesCheckboxFilter,
    RangeNumericFilter,
    RelatedCheckboxFilter,
)
from unfold.contrib.forms.widgets import WysiwygWidget
from unfold.decorators import action, display

from .models import Brand, Motorcycle, MotorcycleImage


@admin.register(Brand)
class BrandAdmin(ModelAdmin):
    list_display = ["name", "country", "motorcycle_count", "order"]
    list_editable = ["order"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ["name"]}

    @display(description=_("Počet motocyklov"))
    def motorcycle_count(self, obj):
        return obj.motorcycles.count()


class MotorcycleImageInline(TabularInline):
    model = MotorcycleImage
    extra = 1
    fields = ["preview", "image", "alt", "order"]
    readonly_fields = ["preview"]
    tab = True

    @display(description=_("Náhľad"))
    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html('<img src="{}" style="height:56px;border-radius:6px" alt="">', obj.image.url)
        return "—"


@admin.register(Motorcycle)
class MotorcycleAdmin(ModelAdmin):
    list_display = [
        "thumbnail", "display_title", "year", "category_label", "engine_cc", "price_display",
        "stock_label", "available", "featured", "new_arrival", "used",
    ]
    list_display_links = ["thumbnail", "display_title"]
    list_editable = ["available", "featured", "new_arrival"]
    list_filter = [
        ("brand", RelatedCheckboxFilter),
        ("category", ChoicesCheckboxFilter),
        ("stock_status", ChoicesCheckboxFilter),
        ("price", RangeNumericFilter),
        ("engine_cc", RangeNumericFilter),
        "used", "available", "featured", "new_arrival",
    ]
    list_filter_submit = True
    list_per_page = 25
    search_fields = ["model", "brand__name", "slug"]
    autocomplete_fields = ["brand"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [MotorcycleImageInline]
    save_on_top = True
    warn_unsaved_form = True
    compressed_fields = True
    formfield_overrides = {models.TextField: {"widget": WysiwygWidget}}
    actions = ["make_available", "make_unavailable", "mark_featured"]
    fieldsets = [
        (_("Základné údaje"), {
            "fields": [("brand", "model"), ("year", "category"), "slug", ("price", "previous_price"),
                       ("stock_status", "color"), "short_description", "description"],
        }),
        (_("Prepínače"), {"fields": [("available", "featured", "new_arrival", "used"), "mileage_km"]}),
        (_("Motor a výkon"), {
            "classes": ["tab"],
            "fields": [("engine_cc", "engine_type"), ("power_hp", "power_kw"), ("torque_nm", "top_speed_kmh"),
                       ("transmission", "gears"), "cooling", "license_category"],
        }),
        (_("Rozmery a výbava"), {
            "classes": ["tab"],
            "fields": [("weight_kg", "seat_height_mm", "fuel_capacity_l"),
                       ("abs", "traction_control", "riding_modes", "quickshifter", "cruise_control"), "extra_specs"],
        }),
        (_("Systém"), {"classes": ["tab"], "fields": [("created_at", "updated_at")]}),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("brand").prefetch_related("images")

    @display(description="", image=True)
    def thumbnail(self, obj):
        cover = obj.images.all()[:1]
        return cover[0].image.url if cover else None

    @display(description=_("Motocykel"), ordering="model", header=True)
    def display_title(self, obj):
        return [obj.title, obj.slug]

    @display(description=_("Kategória"), ordering="category", label=True)
    def category_label(self, obj):
        return obj.get_category_display()

    @display(description=_("Cena"), ordering="price")
    def price_display(self, obj):
        return f"{obj.price:,.0f} €".replace(",", " ")

    @display(
        description=_("Sklad"), ordering="stock_status",
        label={
            Motorcycle.StockStatus.IN_STOCK.label: "success",
            Motorcycle.StockStatus.ON_ORDER.label: "info",
            Motorcycle.StockStatus.IN_TRANSIT.label: "info",
            Motorcycle.StockStatus.RESERVED.label: "warning",
            Motorcycle.StockStatus.SOLD.label: "danger",
        },
    )
    def stock_label(self, obj):
        return obj.get_stock_status_display()

    @action(description=_("Zverejniť na webe"))
    def make_available(self, request, queryset):
        self.message_user(request, _("Zverejnené: %d") % queryset.update(available=True))

    @action(description=_("Skryť z webu"))
    def make_unavailable(self, request, queryset):
        self.message_user(request, _("Skryté: %d") % queryset.update(available=False))

    @action(description=_("Označiť ako odporúčané"))
    def mark_featured(self, request, queryset):
        self.message_user(request, _("Odporúčané: %d") % queryset.update(featured=True))
