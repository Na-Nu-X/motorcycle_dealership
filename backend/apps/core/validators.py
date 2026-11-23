"""Booking date/time validation shared by service and test ride bookings."""

from datetime import date, datetime, time, timedelta

from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework import serializers


def validate_booking_slot(day: date, slot: time, *, min_lead_days: int = 1) -> None:
    """Raise ``ValidationError`` if the requested day/time is not bookable.

    Rules:
      * not in the past and at least ``min_lead_days`` ahead,
      * not further than ``BOOKING_MAX_DAYS_AHEAD`` days,
      * Monday–Friday (Saturday allowed until 12:00), never Sunday,
      * within workshop hours and on a full or half hour.
    """
    today = timezone.localdate()
    if day < today + timedelta(days=min_lead_days):
        raise serializers.ValidationError(
            {"preferred_date": _("Termín je potrebné rezervovať aspoň %(days)s deň vopred.") % {"days": min_lead_days}}
        )
    if day > today + timedelta(days=settings.BOOKING_MAX_DAYS_AHEAD):
        raise serializers.ValidationError(
            {"preferred_date": _("Termín môžete rezervovať maximálne %(days)s dní vopred.")
             % {"days": settings.BOOKING_MAX_DAYS_AHEAD}}
        )
    weekday = day.weekday()
    if weekday == 6:
        raise serializers.ValidationError({"preferred_date": _("V nedeľu máme zatvorené.")})

    close_hour = 12 if weekday == 5 else settings.WORKSHOP_CLOSE_HOUR
    if slot.minute not in (0, 30) or slot.second:
        raise serializers.ValidationError({"preferred_time": _("Vyberte čas v celých alebo polhodinových intervaloch.")})
    if not (time(settings.WORKSHOP_OPEN_HOUR) <= slot < time(close_hour)):
        raise serializers.ValidationError(
            {"preferred_time": _("Vyberte čas počas otváracích hodín (%(open)s:00 – %(close)s:00).")
             % {"open": settings.WORKSHOP_OPEN_HOUR, "close": close_hour}}
        )


def available_slots(day: date) -> list[str]:
    """Return all theoretically bookable HH:MM slots for ``day``."""
    weekday = day.weekday()
    if weekday == 6:
        return []
    close_hour = 12 if weekday == 5 else settings.WORKSHOP_CLOSE_HOUR
    slots, current = [], datetime.combine(day, time(settings.WORKSHOP_OPEN_HOUR))
    end = datetime.combine(day, time(close_hour))
    while current < end:
        slots.append(current.strftime("%H:%M"))
        current += timedelta(minutes=30)
    return slots
