from datetime import date

from django.conf import settings
from django.db.models import Count
from django.utils.translation import gettext as _
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.core.mixins import PublicFormMixin
from apps.core.notifications import notify_staff
from apps.core.validators import available_slots

from .models import ServiceBooking, TestRideBooking
from .serializers import ACTIVE_STATUSES, ServiceBookingSerializer, TestRideBookingSerializer


def _parse_date(raw: str | None) -> date:
    try:
        return date.fromisoformat(raw or "")
    except ValueError:
        raise ValidationError({"date": _("Zadajte dátum vo formáte RRRR-MM-DD.")})


class ServiceBookingViewSet(PublicFormMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = ServiceBookingSerializer

    def perform_create(self, serializer):
        booking = serializer.save()
        notify_staff("Nová servisná zákazka", str(booking))

    @action(detail=False, throttle_classes=[])
    def availability(self, request):
        """Return slots for ``?date=YYYY-MM-DD`` with a flag whether each is still free."""
        day = _parse_date(request.query_params.get("date"))
        taken = {
            row["preferred_time"].strftime("%H:%M"): row["n"]
            for row in ServiceBooking.objects.filter(preferred_date=day, status__in=ACTIVE_STATUSES)
            .values("preferred_time")
            .annotate(n=Count("id"))
        }
        return Response(
            {
                "date": day.isoformat(),
                "slots": [
                    {"time": slot, "available": taken.get(slot, 0) < settings.SERVICE_SLOT_CAPACITY}
                    for slot in available_slots(day)
                ],
            }
        )


class TestRideBookingViewSet(PublicFormMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = TestRideBookingSerializer

    def perform_create(self, serializer):
        booking = serializer.save()
        notify_staff("Nová testovacia jazda", str(booking))

    @action(detail=False, throttle_classes=[])
    def availability(self, request):
        """Free slots for ``?date=`` and ``?motorcycle=<slug>``."""
        day = _parse_date(request.query_params.get("date"))
        slug = request.query_params.get("motorcycle", "")
        taken = set(
            t.strftime("%H:%M")
            for t in TestRideBooking.objects.filter(
                motorcycle__slug=slug, preferred_date=day, status__in=ACTIVE_STATUSES
            ).values_list("preferred_time", flat=True)
        )
        return Response(
            {"date": day.isoformat(),
             "slots": [{"time": s, "available": s not in taken} for s in available_slots(day)]}
        )
