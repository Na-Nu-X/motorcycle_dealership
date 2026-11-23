from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import Motorcycle
from apps.core.models import CustomerContactModel, TimeStampedModel, phone_validator


class InquiryStatus(models.TextChoices):
    NEW = "new", _("Nový")
    IN_PROGRESS = "in_progress", _("V riešení")
    CLOSED = "closed", _("Uzavretý")


class VehicleInquiry(CustomerContactModel):
    class InquiryType(models.TextChoices):
        INTEREST = "interest", _("Mám záujem")
        RESERVATION = "reservation", _("Rezervácia motocykla")
        FINANCING = "financing", _("Financovanie / leasing")
        TRADE_IN = "trade_in", _("Protiúčet")

    motorcycle = models.ForeignKey(
        Motorcycle, on_delete=models.CASCADE, related_name="inquiries", verbose_name=_("motocykel")
    )
    inquiry_type = models.CharField(_("typ dopytu"), max_length=20, choices=InquiryType.choices, default=InquiryType.INTEREST)
    message = models.TextField(_("správa"), blank=True)
    status = models.CharField(_("stav"), max_length=20, choices=InquiryStatus.choices, default=InquiryStatus.NEW, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("dopyt k vozidlu")
        verbose_name_plural = _("dopyty k vozidlám")

    def __str__(self) -> str:
        return f"{self.get_inquiry_type_display()}: {self.motorcycle.title} – {self.customer_name}"


class ContactMessage(TimeStampedModel):
    name = models.CharField(_("meno a priezvisko"), max_length=160)
    email = models.EmailField(_("e-mail"))
    phone = models.CharField(_("telefón"), max_length=20, blank=True, validators=[phone_validator])
    subject = models.CharField(_("predmet"), max_length=160)
    message = models.TextField(_("správa"))
    gdpr_consent = models.BooleanField(_("súhlas so spracovaním údajov"), default=False)
    status = models.CharField(_("stav"), max_length=20, choices=InquiryStatus.choices, default=InquiryStatus.NEW, db_index=True)
    internal_note = models.TextField(_("interná poznámka"), blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("kontaktná správa")
        verbose_name_plural = _("kontaktné správy")

    def __str__(self) -> str:
        return f"{self.subject} – {self.name}"
