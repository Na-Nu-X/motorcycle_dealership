from django.db.models import Count, Max, Min, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import MotorcycleFilter
from .models import Brand, Motorcycle
from .serializers import BrandSerializer, MotorcycleDetailSerializer, MotorcycleListSerializer


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BrandSerializer
    pagination_class = None
    lookup_field = "slug"

    def get_queryset(self):
        return Brand.objects.annotate(
            motorcycle_count=Count("motorcycles", filter=Q(motorcycles__available=True))
        ).filter(motorcycle_count__gt=0)


class MotorcycleViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = "slug"
    filterset_class = MotorcycleFilter
    ordering_fields = ["price", "year", "engine_cc", "power_hp", "created_at", "mileage_km"]
    ordering = ["-featured", "-created_at"]
    search_fields: list[str] = []  # use ?q= (see MotorcycleFilter)

    def get_queryset(self):
        return (
            Motorcycle.objects.filter(available=True)
            .select_related("brand")
            .prefetch_related("images")
        )

    def get_serializer_class(self):
        return MotorcycleDetailSerializer if self.action == "retrieve" else MotorcycleListSerializer

    @action(detail=False)
    def facets(self, request):
        """Ranges and counts used to build the catalog filter UI."""
        qs = Motorcycle.objects.filter(available=True)
        agg = qs.aggregate(
            price_min=Min("price"), price_max=Max("price"), cc_min=Min("engine_cc"), cc_max=Max("engine_cc")
        )
        categories = {row["category"]: row["n"] for row in qs.values("category").annotate(n=Count("id"))}
        return Response(
            {
                **agg,
                "categories": [
                    {"value": value, "label": label, "count": categories.get(value, 0)}
                    for value, label in Motorcycle.Category.choices
                ],
                "brands": [
                    {"slug": b["brand__slug"], "name": b["brand__name"], "count": b["n"]}
                    for b in qs.values("brand__slug", "brand__name").annotate(n=Count("id")).order_by("brand__name")
                ],
                "conditions": {"new": qs.filter(used=False).count(), "used": qs.filter(used=True).count()},
            }
        )

    @action(detail=True)
    def similar(self, request, slug=None):
        bike = self.get_object()
        qs = (
            self.get_queryset()
            .filter(category=bike.category)
            .exclude(pk=bike.pk)
            .order_by("-featured", "price")[:4]
        )
        return Response(MotorcycleListSerializer(qs, many=True, context={"request": request}).data)
