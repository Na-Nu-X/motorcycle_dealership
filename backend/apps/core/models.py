from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

phone_validator = RegexValidator(
    regex=r"^\+?[0-9 ()/-]{7,20}$",
    message=_("Zadajte platné telefónne číslo, napr. +421 900 123 456."),
)


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(_("vytvorené"), auto_now_add=True)
    updated_at = models.DateTimeField(_("upravené"), auto_now=True)

    class Meta:
        abstract = True


class CustomerContactModel(TimeStampedModel):
    """Shared customer contact fields for bookings, orders and inquiries."""

    first_name = models.CharField(_("meno"), max_length=80)
    last_name = models.CharField(_("priezvisko"), max_length=80)
    email = models.EmailField(_("e-mail"))
    phone = models.CharField(_("telefón"), max_length=20, validators=[phone_validator])
    gdpr_consent = models.BooleanField(_("súhlas so spracovaním údajov"), default=False)
    internal_note = models.TextField(_("interná poznámka"), blank=True)

    class Meta:
        abstract = True

    @property
    def customer_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()
