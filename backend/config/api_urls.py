from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.bookings.views import ServiceBookingViewSet, TestRideBookingViewSet
from apps.catalog.views import BrandViewSet, MotorcycleViewSet
from apps.core.views import meta
from apps.inquiries.views import ContactMessageViewSet, VehicleInquiryViewSet
from apps.shop.views import AccessoryViewSet, OrderViewSet

router = DefaultRouter()
router.register("brands", BrandViewSet, basename="brand")
router.register("motorcycles", MotorcycleViewSet, basename="motorcycle")
router.register("accessories", AccessoryViewSet, basename="accessory")
router.register("orders", OrderViewSet, basename="order")
router.register("service-bookings", ServiceBookingViewSet, basename="service-booking")
router.register("test-rides", TestRideBookingViewSet, basename="test-ride")
router.register("inquiries", VehicleInquiryViewSet, basename="inquiry")
router.register("contact", ContactMessageViewSet, basename="contact")

urlpatterns = [
    path("meta/", meta, name="meta"),
    path("", include(router.urls)),
]
