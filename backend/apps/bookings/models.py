from django.core.validators import MaxValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import Motorcycle
from apps.core.models import CustomerContactModel


class BookingStatus(models.TextChoices):
    NEW = "new", _("Nová")
    CONFIRMED = "confirmed", _("Potvrdená")
    COMPLETED = "completed", _("Dokončená")
    CANCELLED = "cancelled", _("Zrušená")


class ServiceBooking(CustomerContactModel):
    class ServiceType(models.TextChoices):
        MAINTENANCE = "maintenance", _("Pravidelná údržba")
        TIRES = "tires", _("Výmena pneumatík")
        DIAGNOSTICS = "diagnostics", _("Diagnostika")
        REPAIR = "repair", _("Oprava")

    motorcycle_model = models.CharField(_("motocykel (značka a model)"), max_length=120)
    motorcycle_year = models.PositiveSmallIntegerField(
        _("rok výroby"), null=True, blank=True, validators=[MaxValueValidator(2100)]
    )
    mileage_km = models.PositiveIntegerField(_("stav tachometra (km)"), null=True, blank=True)
    license_plate = models.CharField(_("EČV"), max_length=12, blank=True)
    service_type = models.CharField(_("typ servisu"), max_length=20, choices=ServiceType.choices)
    preferred_date = models.DateField(_("preferovaný dátum"), db_index=True)
    preferred_time = models.TimeField(_("preferovaný čas"))
    note = models.TextField(_("popis problému / poznámka"), blank=True)
    status = models.CharField(
        _("stav"), max_length=20, choices=BookingStatus.choices, default=BookingStatus.NEW, db_index=True
    )

    class Meta:
        ordering = ["-preferred_date", "-preferred_time"]
        verbose_name = _("servisná zákazka")
        verbose_name_plural = _("servisné zákazky")

    def __str__(self) -> str:
        return f"{self.get_service_type_display()} – {self.customer_name} ({self.preferred_date:%d.%m.%Y})"


class TestRideBooking(CustomerContactModel):
    class LicenseCategory(models.TextChoices):
        A1 = "A1", "A1"
        A2 = "A2", "A2"
        A = "A", "A"

    motorcycle = models.ForeignKey(
        Motorcycle, on_delete=models.PROTECT, related_name="test_rides", verbose_name=_("motocykel")
    )
    preferred_date = models.DateField(_("preferovaný dátum"), db_index=True)
    preferred_time = models.TimeField(_("preferovaný čas"))
    license_category = models.CharField(_("skupina vodičského oprávnenia"), max_length=3, choices=LicenseCategory.choices)
    license_confirmed = models.BooleanField(_("potvrdil platný vodičský preukaz"), default=False)
    riding_experience_years = models.PositiveSmallIntegerField(
        _("roky jazdných skúseností"), default=0, validators=[MaxValueValidator(80)]
    )
    note = models.TextField(_("poznámka"), blank=True)
    status = models.CharField(
        _("stav"), max_length=20, choices=BookingStatus.choices, default=BookingStatus.NEW, db_index=True
    )

    class Meta:
        ordering = ["-preferred_date", "-preferred_time"]
        verbose_name = _("rezervácia testovacej jazdy")
        verbose_name_plural = _("rezervácie testovacích jázd")

    def __str__(self) -> str:
        return f"{self.motorcycle.title} – {self.customer_name} ({self.preferred_date:%d.%m.%Y})"
