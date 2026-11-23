from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.bookings.models import ServiceBooking, TestRideBooking
from apps.catalog.models import Motorcycle
from apps.inquiries.models import VehicleInquiry
from apps.shop.models import Accessory, Order
from apps.shop.serializers import COURIER_PRICE, FREE_SHIPPING_FROM


def _choices(choices):
    return [{"value": value, "label": str(label)} for value, label in choices]


@api_view(["GET"])
def meta(request):
    """Enumerations and business settings the frontend needs to render forms."""
    return Response(
        {
            "site_name": settings.SITE_NAME,
            "motorcycle_categories": _choices(Motorcycle.Category.choices),
            "accessory_categories": _choices(Accessory.Category.choices),
            "service_types": _choices(ServiceBooking.ServiceType.choices),
            "license_categories": _choices(TestRideBooking.LicenseCategory.choices),
            "inquiry_types": _choices(VehicleInquiry.InquiryType.choices),
            "delivery_methods": _choices(Order.Delivery.choices),
            "shipping": {"courier_price": str(COURIER_PRICE), "free_from": str(FREE_SHIPPING_FROM)},
            "workshop": {
                "open_hour": settings.WORKSHOP_OPEN_HOUR,
                "close_hour": settings.WORKSHOP_CLOSE_HOUR,
                "saturday_close_hour": 12,
                "max_days_ahead": settings.BOOKING_MAX_DAYS_AHEAD,
            },
        }
    )
