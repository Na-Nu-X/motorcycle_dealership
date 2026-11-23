from rest_framework import serializers

from .models import Brand, Motorcycle, MotorcycleImage


class BrandSerializer(serializers.ModelSerializer):
    motorcycle_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "country", "logo", "motorcycle_count"]


class MotorcycleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotorcycleImage
        fields = ["id", "image", "alt"]


class MotorcycleListSerializer(serializers.ModelSerializer):
    brand = serializers.CharField(source="brand.name")
    brand_slug = serializers.CharField(source="brand.slug")
    category_label = serializers.CharField(source="get_category_display")
    stock_status_label = serializers.CharField(source="get_stock_status_display")
    image = serializers.SerializerMethodField()

    class Meta:
        model = Motorcycle
        fields = [
            "id", "slug", "brand", "brand_slug", "model", "year", "category", "category_label",
            "engine_cc", "power_hp", "power_kw", "price", "previous_price", "mileage_km",
            "stock_status", "stock_status_label", "license_category", "short_description",
            "featured", "new_arrival", "used", "image",
        ]

    def get_image(self, obj):
        images = list(obj.images.all()[:1])
        if not images:
            return None
        request = self.context.get("request")
        url = images[0].image.url
        return request.build_absolute_uri(url) if request else url


class MotorcycleDetailSerializer(MotorcycleListSerializer):
    images = MotorcycleImageSerializer(many=True, read_only=True)
    transmission_label = serializers.CharField(source="get_transmission_display")
    cooling_label = serializers.CharField(source="get_cooling_display")

    class Meta(MotorcycleListSerializer.Meta):
        fields = MotorcycleListSerializer.Meta.fields + [
            "description", "color", "engine_type", "transmission", "transmission_label", "gears",
            "cooling", "cooling_label", "torque_nm", "weight_kg", "seat_height_mm", "fuel_capacity_l",
            "top_speed_kmh", "abs", "traction_control", "riding_modes", "quickshifter", "cruise_control",
            "extra_specs", "images",
        ]
