from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel

HP_TO_KW = Decimal("0.7457")


def unique_slug(instance, value: str, field: str = "slug") -> str:
    base = slugify(value)[:200] or "item"
    slug, n = base, 2
    model = type(instance)
    while model.objects.filter(**{field: slug}).exclude(pk=instance.pk).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug


class Brand(TimeStampedModel):
    name = models.CharField(_("názov"), max_length=80, unique=True)
    slug = models.SlugField(_("slug"), max_length=100, unique=True, blank=True)
    country = models.CharField(_("krajina pôvodu"), max_length=60, blank=True)
    logo = models.ImageField(_("logo"), upload_to="brands/", blank=True)
    description = models.TextField(_("popis"), blank=True)
    order = models.PositiveSmallIntegerField(_("poradie"), default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = _("značka")
        verbose_name_plural = _("značky")

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(self, self.name)
        super().save(*args, **kwargs)


class Motorcycle(TimeStampedModel):
    class Category(models.TextChoices):
        ADVENTURE = "adventure", _("Adventure")
        CRUISER = "cruiser", _("Cruiser")
        SPORT = "sport", _("Šport")
        NAKED = "naked", _("Naked")
        SCOOTER = "scooter", _("Skúter")

    class StockStatus(models.TextChoices):
        IN_STOCK = "in_stock", _("Skladom")
        ON_ORDER = "on_order", _("Na objednávku")
        IN_TRANSIT = "in_transit", _("Na ceste")
        RESERVED = "reserved", _("Rezervované")
        SOLD = "sold", _("Predané")

    class Transmission(models.TextChoices):
        MANUAL = "manual", _("Manuálna")
        DCT = "dct", _("DCT (dvojspojková)")
        CVT = "cvt", _("Automatická (CVT)")

    class Cooling(models.TextChoices):
        LIQUID = "liquid", _("Kvapalinou")
        AIR = "air", _("Vzduchom")
        AIR_OIL = "air_oil", _("Vzduch/olej")

    class LicenseCategory(models.TextChoices):
        AM = "AM", "AM"
        A1 = "A1", "A1"
        A2 = "A2", "A2"
        A = "A", "A"

    brand = models.ForeignKey(Brand, verbose_name=_("značka"), on_delete=models.PROTECT, related_name="motorcycles")
    model = models.CharField(_("model"), max_length=120)
    slug = models.SlugField(_("slug"), max_length=220, unique=True, blank=True)
    year = models.PositiveSmallIntegerField(
        _("rok výroby"), validators=[MinValueValidator(1950), MaxValueValidator(2100)]
    )
    category = models.CharField(_("kategória"), max_length=20, choices=Category.choices, db_index=True)
    engine_cc = models.PositiveIntegerField(_("objem motora (cm³)"), db_index=True)
    power_hp = models.DecimalField(_("výkon (k)"), max_digits=6, decimal_places=1)
    power_kw = models.DecimalField(
        _("výkon (kW)"), max_digits=6, decimal_places=1, blank=True, help_text=_("Ak necháte prázdne, dopočíta sa z k.")
    )
    torque_nm = models.DecimalField(_("krútiaci moment (Nm)"), max_digits=6, decimal_places=1, null=True, blank=True)
    price = models.DecimalField(_("cena (EUR)"), max_digits=10, decimal_places=2, db_index=True)
    previous_price = models.DecimalField(
        _("pôvodná cena (EUR)"), max_digits=10, decimal_places=2, null=True, blank=True,
        help_text=_("Vyplňte pri zľave – zobrazí sa prečiarknutá."),
    )
    mileage_km = models.PositiveIntegerField(_("najazdené km"), default=0, help_text=_("Pre jazdené motocykle."))
    stock_status = models.CharField(
        _("stav skladu"), max_length=20, choices=StockStatus.choices, default=StockStatus.IN_STOCK
    )
    color = models.CharField(_("farba"), max_length=60, blank=True)
    license_category = models.CharField(
        _("vodičské oprávnenie"), max_length=3, choices=LicenseCategory.choices, default=LicenseCategory.A
    )

    # Technical specification
    engine_type = models.CharField(_("typ motora"), max_length=120, blank=True, help_text=_("napr. 2-valec do V, 4T"))
    transmission = models.CharField(_("prevodovka"), max_length=10, choices=Transmission.choices, default=Transmission.MANUAL)
    gears = models.PositiveSmallIntegerField(_("počet prevodov"), null=True, blank=True)
    cooling = models.CharField(_("chladenie"), max_length=10, choices=Cooling.choices, default=Cooling.LIQUID)
    weight_kg = models.PositiveSmallIntegerField(_("hmotnosť (kg)"), null=True, blank=True)
    seat_height_mm = models.PositiveSmallIntegerField(_("výška sedla (mm)"), null=True, blank=True)
    fuel_capacity_l = models.DecimalField(_("objem nádrže (l)"), max_digits=4, decimal_places=1, null=True, blank=True)
    top_speed_kmh = models.PositiveSmallIntegerField(_("max. rýchlosť (km/h)"), null=True, blank=True)
    abs = models.BooleanField(_("ABS"), default=True)
    traction_control = models.BooleanField(_("kontrola trakcie"), default=False)
    riding_modes = models.BooleanField(_("jazdné režimy"), default=False)
    quickshifter = models.BooleanField(_("quickshifter"), default=False)
    cruise_control = models.BooleanField(_("tempomat"), default=False)
    extra_specs = models.JSONField(
        _("ďalšie parametre"), default=dict, blank=True,
        help_text=_('Voliteľné páry „názov: hodnota“, napr. {"Predné odpruženie": "USD 43 mm"}.'),
    )

    short_description = models.CharField(_("krátky popis"), max_length=240, blank=True)
    description = models.TextField(_("popis"), blank=True)

    # Toggle switches
    available = models.BooleanField(_("dostupný na webe"), default=True, db_index=True)
    featured = models.BooleanField(_("odporúčaný"), default=False, db_index=True)
    new_arrival = models.BooleanField(_("novinka"), default=False)
    used = models.BooleanField(_("jazdený"), default=False, db_index=True)

    class Meta:
        ordering = ["-featured", "-created_at"]
        verbose_name = _("motocykel")
        verbose_name_plural = _("motocykle")
        indexes = [models.Index(fields=["available", "category", "price"])]

    def __str__(self) -> str:
        return f"{self.brand.name} {self.model} ({self.year})"

    @property
    def title(self) -> str:
        return f"{self.brand.name} {self.model}"

    @property
    def cover_image(self):
        return self.images.first()

    def get_absolute_url(self) -> str:
        return f"{settings.FRONTEND_URL}/motocykle/{self.slug}"

    def save(self, *args, **kwargs):
        if self.power_kw is None and self.power_hp is not None:
            self.power_kw = (Decimal(self.power_hp) * HP_TO_KW).quantize(Decimal("0.1"))
        if not self.slug:
            self.slug = unique_slug(self, f"{self.brand.name} {self.model} {self.year}")
        super().save(*args, **kwargs)


class MotorcycleImage(models.Model):
    motorcycle = models.ForeignKey(Motorcycle, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(_("obrázok"), upload_to="motorcycles/%Y/")
    alt = models.CharField(_("alternatívny text"), max_length=160, blank=True)
    order = models.PositiveSmallIntegerField(_("poradie"), default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = _("fotografia")
        verbose_name_plural = _("fotogaléria")

    def __str__(self) -> str:
        return self.alt or f"{self.motorcycle} #{self.order}"
