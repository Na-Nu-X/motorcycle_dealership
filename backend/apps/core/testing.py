"""Shared helpers for the test-suite."""

from datetime import date, timedelta
from decimal import Decimal

from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.catalog.models import Brand, Motorcycle

CUSTOMER = {
    "first_name": "Ján",
    "last_name": "Testovací",
    "email": "jan@example.sk",
    "phone": "+421 900 123 456",
    "gdpr_consent": True,
}


def next_weekday(min_days: int = 2, weekday: int | None = None) -> date:
    """First Mon–Fri (or the given weekday) at least ``min_days`` from today."""
    day = timezone.localdate() + timedelta(days=min_days)
    while (weekday is None and day.weekday() >= 5) or (weekday is not None and day.weekday() != weekday):
        day += timedelta(days=1)
    return day


def make_brand(name="Ducati") -> Brand:
    return Brand.objects.get_or_create(name=name)[0]


def make_bike(**overrides) -> Motorcycle:
    brand = overrides.pop("brand", None) or make_brand()
    data = dict(
        model="Test", year=2024, category="naked", engine_cc=900, power_hp=Decimal("100"),
        price=Decimal("10000"), license_category="A",
    )
    data.update(overrides)
    return Motorcycle.objects.create(brand=brand, **data)


class ApiTestCase(APITestCase):
    def setUp(self):
        super().setUp()
        cache.clear()  # reset throttling counters between tests
