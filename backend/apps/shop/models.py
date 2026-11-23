from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import unique_slug
from apps.core.models import CustomerContactModel, TimeStampedModel


def split_csv(value: str) -> list[str]:
    return [item.strip() for item in (value or "").split(",") if item.strip()]


class Accessory(TimeStampedModel):
    class Category(models.TextChoices):
        HELMETS = "helmets", _("Prilby")
        JACKETS = "jackets", _("Bundy")
        GLOVES = "gloves", _("Rukavice")
        BOOTS = "boots", _("Topánky")
        PARTS = "parts", _("Diely a doplnky")
        MAINTENANCE = "maintenance", _("Údržba a chémia")

    name = models.CharField(_("názov"), max_length=160)
    slug = models.SlugField(_("slug"), max_length=200, unique=True, blank=True)
    brand = models.CharField(_("výrobca"), max_length=80, blank=True)
    sku = models.CharField(_("katalógové číslo"), max_length=40, unique=True, blank=True, null=True)
    category = models.CharField(_("kategória"), max_length=20, choices=Category.choices, db_index=True)
    price = models.DecimalField(
        _("cena (EUR)"), max_digits=9, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    previous_price = models.DecimalField(_("pôvodná cena (EUR)"), max_digits=9, decimal_places=2, null=True, blank=True)
    sizes = models.CharField(
        _("veľkosti"), max_length=200, blank=True, help_text=_("Oddeľte čiarkou, napr. S, M, L, XL.")
    )
    colors = models.CharField(_("farby"), max_length=200, blank=True, help_text=_("Oddeľte čiarkou."))
    stock = models.PositiveIntegerField(_("skladom (ks)"), default=0)
    short_description = models.CharField(_("krátky popis"), max_length=240, blank=True)
    description = models.TextField(_("popis"), blank=True)
    image = models.ImageField(_("obrázok"), upload_to="accessories/", blank=True)
    active = models.BooleanField(_("aktívne"), default=True, db_index=True)
    featured = models.BooleanField(_("odporúčané"), default=False)

    class Meta:
        ordering = ["-featured", "name"]
        verbose_name = _("príslušenstvo / oblečenie")
        verbose_name_plural = _("príslušenstvo & oblečenie")

    def __str__(self) -> str:
        return self.name

    @property
    def size_list(self) -> list[str]:
        return split_csv(self.sizes)

    @property
    def color_list(self) -> list[str]:
        return split_csv(self.colors)

    @property
    def in_stock(self) -> bool:
        return self.stock > 0

    def get_absolute_url(self) -> str:
        return f"{settings.FRONTEND_URL}/prislusenstvo/{self.slug}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(self, self.name)
        if not self.sku:
            self.sku = None
        super().save(*args, **kwargs)


class Order(CustomerContactModel):
    class Status(models.TextChoices):
        NEW = "new", _("Nová")
        CONFIRMED = "confirmed", _("Potvrdená")
        READY = "ready", _("Pripravená / odoslaná")
        COMPLETED = "completed", _("Vybavená")
        CANCELLED = "cancelled", _("Zrušená")

    class Delivery(models.TextChoices):
        PICKUP = "pickup", _("Osobný odber na predajni")
        COURIER = "courier", _("Kuriér")

    number = models.CharField(_("číslo objednávky"), max_length=20, unique=True, editable=False)
    status = models.CharField(_("stav"), max_length=20, choices=Status.choices, default=Status.NEW, db_index=True)
    delivery_method = models.CharField(_("doprava"), max_length=20, choices=Delivery.choices, default=Delivery.PICKUP)
    street = models.CharField(_("ulica a číslo"), max_length=160, blank=True)
    city = models.CharField(_("mesto"), max_length=80, blank=True)
    postal_code = models.CharField(_("PSČ"), max_length=10, blank=True)
    note = models.TextField(_("poznámka zákazníka"), blank=True)
    shipping_price = models.DecimalField(_("doprava (EUR)"), max_digits=8, decimal_places=2, default=Decimal("0"))
    total = models.DecimalField(_("spolu (EUR)"), max_digits=10, decimal_places=2, default=Decimal("0"))
    reserved_motorcycles = models.ManyToManyField(
        "catalog.Motorcycle", blank=True, related_name="reservation_orders",
        verbose_name=_("rezervované motocykle"),
        help_text=_("Žiadosti o rezerváciu motocyklov z košíka – cena sa dohaduje individuálne."),
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("objednávka")
        verbose_name_plural = _("objednávky")

    def __str__(self) -> str:
        return f"{self.number} – {self.customer_name}"

    def save(self, *args, **kwargs):
        if not self.number:
            from django.utils import timezone

            prefix = timezone.localdate().strftime("%y%m")
            last = Order.objects.filter(number__startswith=prefix).order_by("-number").first()
            seq = int(last.number[4:]) + 1 if last else 1
            self.number = f"{prefix}{seq:05d}"
        super().save(*args, **kwargs)

    def recalculate_total(self) -> None:
        items_total = sum((item.line_total for item in self.items.all()), Decimal("0"))
        self.total = items_total + self.shipping_price
        self.save(update_fields=["total", "updated_at"])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items", verbose_name=_("objednávka"))
    accessory = models.ForeignKey(
        Accessory, on_delete=models.SET_NULL, null=True, related_name="order_items", verbose_name=_("produkt")
    )
    name = models.CharField(_("názov"), max_length=160)
    size = models.CharField(_("veľkosť"), max_length=20, blank=True)
    color = models.CharField(_("farba"), max_length=40, blank=True)
    quantity = models.PositiveIntegerField(_("množstvo"), validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(_("cena/ks (EUR)"), max_digits=9, decimal_places=2)

    class Meta:
        verbose_name = _("položka objednávky")
        verbose_name_plural = _("položky objednávky")

    def __str__(self) -> str:
        return f"{self.quantity}× {self.name}"

    @property
    def line_total(self) -> Decimal:
        return (self.unit_price or Decimal("0")) * (self.quantity or 0)
