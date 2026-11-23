from decimal import Decimal

from django.db import transaction
from django.utils.translation import gettext as _
from rest_framework import serializers

from apps.core.serializers import GdprConsentMixin, HoneypotSerializerMixin

from .models import Accessory, Order, OrderItem

COURIER_PRICE = Decimal("6.90")
FREE_SHIPPING_FROM = Decimal("150.00")
MAX_QUANTITY_PER_LINE = 20


class AccessorySerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    sizes = serializers.ListField(source="size_list", read_only=True)
    colors = serializers.ListField(source="color_list", read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Accessory
        fields = [
            "id", "slug", "name", "brand", "sku", "category", "category_label", "price", "previous_price",
            "sizes", "colors", "stock", "in_stock", "short_description", "description", "image", "featured",
        ]


class OrderItemInputSerializer(serializers.Serializer):
    accessory = serializers.PrimaryKeyRelatedField(queryset=Accessory.objects.filter(active=True))
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_QUANTITY_PER_LINE)
    size = serializers.CharField(required=False, allow_blank=True, max_length=20)
    color = serializers.CharField(required=False, allow_blank=True, max_length=40)

    def validate(self, attrs):
        accessory: Accessory = attrs["accessory"]
        size, color = attrs.get("size", ""), attrs.get("color", "")
        if accessory.size_list and size not in accessory.size_list:
            raise serializers.ValidationError({"size": _("Vyberte platnú veľkosť pre „%s“.") % accessory.name})
        if not accessory.size_list and size:
            attrs["size"] = ""
        if accessory.color_list and color not in accessory.color_list:
            raise serializers.ValidationError({"color": _("Vyberte platnú farbu pre „%s“.") % accessory.name})
        if not accessory.color_list and color:
            attrs["color"] = ""
        return attrs


class OrderCreateSerializer(HoneypotSerializerMixin, GdprConsentMixin, serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = [
            "first_name", "last_name", "email", "phone", "delivery_method", "street", "city", "postal_code",
            "note", "gdpr_consent", "items", "website",
        ]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError(_("Košík je prázdny."))
        if len(items) > 30:
            raise serializers.ValidationError(_("Objednávka obsahuje príliš veľa položiek."))
        return items

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs.get("delivery_method") == Order.Delivery.COURIER:
            missing = {f: _("Pri doručení kuriérom je toto pole povinné.")
                       for f in ("street", "city", "postal_code") if not attrs.get(f, "").strip()}
            if missing:
                raise serializers.ValidationError(missing)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")

        # Lock stock rows to avoid overselling under concurrent orders.
        ids = {item["accessory"].pk for item in items}
        locked = {a.pk: a for a in Accessory.objects.select_for_update().filter(pk__in=ids)}
        demand: dict[int, int] = {}
        for item in items:
            demand[item["accessory"].pk] = demand.get(item["accessory"].pk, 0) + item["quantity"]
        errors = [
            _("„%(name)s“ – skladom je len %(stock)d ks.") % {"name": locked[pk].name, "stock": locked[pk].stock}
            for pk, qty in demand.items() if locked[pk].stock < qty
        ]
        if errors:
            raise serializers.ValidationError({"items": errors})

        order = Order.objects.create(**validated_data)
        subtotal = Decimal("0")
        for item in items:
            accessory = locked[item["accessory"].pk]
            line = OrderItem.objects.create(
                order=order, accessory=accessory, name=accessory.name, size=item.get("size", ""),
                color=item.get("color", ""), quantity=item["quantity"], unit_price=accessory.price,
            )
            subtotal += line.line_total
        for pk, qty in demand.items():
            locked[pk].stock -= qty
            locked[pk].save(update_fields=["stock", "updated_at"])

        order.shipping_price = shipping_for(order.delivery_method, subtotal)
        order.total = subtotal + order.shipping_price
        order.save(update_fields=["shipping_price", "total"])
        return order

    def to_representation(self, instance):
        return {"number": instance.number, "total": str(instance.total), "shipping_price": str(instance.shipping_price)}


def shipping_for(method: str, subtotal: Decimal) -> Decimal:
    if method != Order.Delivery.COURIER or subtotal >= FREE_SHIPPING_FROM:
        return Decimal("0.00")
    return COURIER_PRICE
