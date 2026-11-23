import django_filters as df
from django.db.models import Q

from apps.catalog.filters import CharInFilter

from .models import Accessory


class AccessoryFilter(df.FilterSet):
    category = CharInFilter(field_name="category", lookup_expr="in")
    price_min = df.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = df.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = df.BooleanFilter(method="filter_in_stock")
    featured = df.BooleanFilter()
    q = df.CharFilter(method="filter_search")

    class Meta:
        model = Accessory
        fields: list[str] = []

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock__gt=0) if value else queryset

    def filter_search(self, queryset, name, value):
        for term in value.split():
            queryset = queryset.filter(Q(name__icontains=term) | Q(brand__icontains=term))
        return queryset
