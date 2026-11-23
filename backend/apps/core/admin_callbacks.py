"""Callbacks referenced from ``settings.UNFOLD``."""

from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def environment_callback(request):
    if settings.DEBUG:
        return [_("Vývoj"), "warning"]
    return [_("Produkcia"), "success"]


def _count_new(model_path: str) -> int | None:
    from django.apps import apps

    model = apps.get_model(model_path)
    count = model.objects.filter(status="new").count()
    return count or None


def badge_new_orders(request):
    return _count_new("shop.Order")


def badge_new_service(request):
    return _count_new("bookings.ServiceBooking")


def badge_new_test_rides(request):
    return _count_new("bookings.TestRideBooking")


def badge_new_inquiries(request):
    return _count_new("inquiries.VehicleInquiry")


def dashboard_callback(request, context):
    from apps.bookings.models import ServiceBooking, TestRideBooking
    from apps.catalog.models import Motorcycle
    from apps.inquiries.models import ContactMessage, VehicleInquiry
    from apps.shop.models import Accessory, Order

    today = timezone.localdate()
    context.update(
        {
            "kpis": [
                {"title": _("Motocykle v ponuke"), "value": Motorcycle.objects.filter(available=True).count()},
                {"title": _("Nové objednávky"), "value": Order.objects.filter(status="new").count()},
                {
                    "title": _("Servis – nadchádzajúce"),
                    "value": ServiceBooking.objects.filter(preferred_date__gte=today)
                    .exclude(status="cancelled")
                    .count(),
                },
                {
                    "title": _("Testovacie jazdy – nové"),
                    "value": TestRideBooking.objects.filter(status="new").count(),
                },
                {
                    "title": _("Nevybavené dopyty"),
                    "value": VehicleInquiry.objects.filter(status="new").count()
                    + ContactMessage.objects.filter(status="new").count(),
                },
                {"title": _("Tovar bez zásob"), "value": Accessory.objects.filter(active=True, stock=0).count()},
            ],
            "service_table": {
                "headers": [_("Termín"), _("Zákazník"), _("Motocykel"), _("Servis")],
                "rows": [
                    [f"{b.preferred_date:%d.%m.} {b.preferred_time:%H:%M}", b.customer_name, b.motorcycle_model,
                     b.get_service_type_display()]
                    for b in ServiceBooking.objects.filter(preferred_date__gte=today)
                    .exclude(status="cancelled")
                    .order_by("preferred_date", "preferred_time")[:6]
                ],
            },
            "ride_table": {
                "headers": [_("Termín"), _("Zákazník"), _("Motocykel"), _("Oprávnenie")],
                "rows": [
                    [f"{r.preferred_date:%d.%m.} {r.preferred_time:%H:%M}", r.customer_name, r.motorcycle.title,
                     r.license_category]
                    for r in TestRideBooking.objects.filter(preferred_date__gte=today)
                    .exclude(status="cancelled")
                    .select_related("motorcycle__brand")
                    .order_by("preferred_date", "preferred_time")[:6]
                ],
            },
        }
    )
    return context
