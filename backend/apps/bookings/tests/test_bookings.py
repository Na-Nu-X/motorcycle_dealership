from datetime import time, timedelta

from django.test import override_settings
from django.utils import timezone
from rest_framework import serializers

from apps.bookings.models import ServiceBooking, TestRideBooking
from apps.core.testing import CUSTOMER, ApiTestCase, make_bike, next_weekday
from apps.core.validators import available_slots, validate_booking_slot


class SlotValidatorTests(ApiTestCase):
    def assertInvalid(self, day, slot, field):
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_booking_slot(day, slot)
        self.assertIn(field, ctx.exception.detail)

    def test_valid_weekday_slot(self):
        validate_booking_slot(next_weekday(), time(10, 30))

    def test_past_and_today_rejected(self):
        self.assertInvalid(timezone.localdate() - timedelta(days=1), time(10), "preferred_date")
        self.assertInvalid(timezone.localdate(), time(10), "preferred_date")

    def test_too_far_ahead_rejected(self):
        self.assertInvalid(timezone.localdate() + timedelta(days=400), time(10), "preferred_date")

    def test_sunday_rejected(self):
        self.assertInvalid(next_weekday(weekday=6), time(10), "preferred_date")

    def test_saturday_only_morning(self):
        saturday = next_weekday(weekday=5)
        validate_booking_slot(saturday, time(11, 30))
        self.assertInvalid(saturday, time(12), "preferred_time")

    def test_outside_opening_hours(self):
        self.assertInvalid(next_weekday(), time(7, 30), "preferred_time")
        self.assertInvalid(next_weekday(), time(17), "preferred_time")

    def test_odd_minutes_rejected(self):
        self.assertInvalid(next_weekday(), time(10, 15), "preferred_time")

    def test_available_slots(self):
        self.assertEqual(available_slots(next_weekday(weekday=6)), [])
        self.assertEqual(available_slots(next_weekday(weekday=5))[-1], "11:30")
        weekday_slots = available_slots(next_weekday(weekday=2))
        self.assertEqual((weekday_slots[0], weekday_slots[-1], len(weekday_slots)), ("08:00", "16:30", 18))


class ServiceBookingApiTests(ApiTestCase):
    def payload(self, **overrides):
        data = {**CUSTOMER, "motorcycle_model": "Honda CB650R", "service_type": "maintenance",
                "preferred_date": next_weekday().isoformat(), "preferred_time": "09:00"}
        data.update(overrides)
        return data

    def test_create(self):
        response = self.client.post("/api/service-bookings/", self.payload(), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["status"], "new")
        self.assertEqual(ServiceBooking.objects.count(), 1)

    def test_invalid_service_type(self):
        response = self.client.post("/api/service-bookings/", self.payload(service_type="wash"), format="json")
        self.assertIn("service_type", response.json())

    def test_invalid_phone(self):
        response = self.client.post("/api/service-bookings/", self.payload(phone="abc"), format="json")
        self.assertIn("phone", response.json())

    def test_status_cannot_be_set_by_client(self):
        response = self.client.post("/api/service-bookings/", self.payload(status="confirmed"), format="json")
        self.assertEqual(response.json()["status"], "new")

    @override_settings(SERVICE_SLOT_CAPACITY=1)
    def test_slot_capacity_and_availability(self):
        self.assertEqual(self.client.post("/api/service-bookings/", self.payload(), format="json").status_code, 201)
        second = self.client.post("/api/service-bookings/", self.payload(), format="json")
        self.assertEqual(second.status_code, 400)
        self.assertIn("preferred_time", second.json())
        slots = self.client.get(f"/api/service-bookings/availability/?date={next_weekday().isoformat()}").json()
        nine = next(s for s in slots["slots"] if s["time"] == "09:00")
        self.assertFalse(nine["available"])

    @override_settings(SERVICE_SLOT_CAPACITY=1)
    def test_cancelled_booking_frees_slot(self):
        self.client.post("/api/service-bookings/", self.payload(), format="json")
        ServiceBooking.objects.update(status="cancelled")
        self.assertEqual(self.client.post("/api/service-bookings/", self.payload(), format="json").status_code, 201)

    def test_availability_requires_valid_date(self):
        self.assertEqual(self.client.get("/api/service-bookings/availability/?date=nope").status_code, 400)

    def test_honeypot(self):
        response = self.client.post("/api/service-bookings/", self.payload(website="x"), format="json")
        self.assertEqual(response.status_code, 400)


class TestRideApiTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.bike = make_bike(model="Monster", license_category="A")
        self.a2_bike = make_bike(model="Scrambler", license_category="A2")

    def payload(self, **overrides):
        data = {**CUSTOMER, "motorcycle": self.bike.slug, "preferred_date": next_weekday().isoformat(),
                "preferred_time": "14:00", "license_category": "A", "license_confirmed": True,
                "riding_experience_years": 4}
        data.update(overrides)
        return data

    def test_create(self):
        response = self.client.post("/api/test-rides/", self.payload(), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(TestRideBooking.objects.get().motorcycle, self.bike)

    def test_license_confirmation_required(self):
        response = self.client.post("/api/test-rides/", self.payload(license_confirmed=False), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("license_confirmed", response.json())

    def test_license_category_must_match_bike(self):
        response = self.client.post("/api/test-rides/", self.payload(license_category="A2"), format="json")
        self.assertIn("license_category", response.json())
        ok = self.client.post("/api/test-rides/", self.payload(motorcycle=self.a2_bike.slug, license_category="A2"),
                              format="json")
        self.assertEqual(ok.status_code, 201, ok.content)

    def test_same_bike_same_slot_rejected(self):
        self.client.post("/api/test-rides/", self.payload(), format="json")
        response = self.client.post("/api/test-rides/", self.payload(email="iny@example.sk"), format="json")
        self.assertIn("preferred_time", response.json())
        free = self.client.get(
            f"/api/test-rides/availability/?date={next_weekday().isoformat()}&motorcycle={self.bike.slug}"
        ).json()
        self.assertFalse(next(s for s in free["slots"] if s["time"] == "14:00")["available"])

    def test_sold_or_hidden_bike_rejected(self):
        self.bike.stock_status = "sold"
        self.bike.save()
        self.assertIn("motorcycle", self.client.post("/api/test-rides/", self.payload(), format="json").json())
        hidden = make_bike(model="Hidden", available=False)
        response = self.client.post("/api/test-rides/", self.payload(motorcycle=hidden.slug), format="json")
        self.assertIn("motorcycle", response.json())

    def test_sunday_rejected(self):
        response = self.client.post(
            "/api/test-rides/", self.payload(preferred_date=next_weekday(weekday=6).isoformat()), format="json"
        )
        self.assertIn("preferred_date", response.json())
