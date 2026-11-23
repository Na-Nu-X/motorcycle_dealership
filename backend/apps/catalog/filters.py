import django_filters as df
from django.db.models import Q

from .models import Motorcycle


class CharInFilter(df.BaseInFilter, df.CharFilter):
    """Accepts comma separated values: ``?category=sport,naked``."""


class MotorcycleFilter(df.FilterSet):
    category = CharInFilter(field_name="category", lookup_expr="in")
    brand = CharInFilter(field_name="brand__slug", lookup_expr="in")
    price_min = df.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = df.NumberFilter(field_name="price", lookup_expr="lte")
    cc_min = df.NumberFilter(field_name="engine_cc", lookup_expr="gte")
    cc_max = df.NumberFilter(field_name="engine_cc", lookup_expr="lte")
    year_min = df.NumberFilter(field_name="year", lookup_expr="gte")
    condition = df.ChoiceFilter(choices=[("new", "new"), ("used", "used")], method="filter_condition")
    license = CharInFilter(field_name="license_category", lookup_expr="in")
    featured = df.BooleanFilter()
    new_arrival = df.BooleanFilter()
    in_stock = df.BooleanFilter(method="filter_in_stock")
    q = df.CharFilter(method="filter_search")

    class Meta:
        model = Motorcycle
        fields: list[str] = []

    def filter_condition(self, queryset, name, value):
        return queryset.filter(used=(value == "used"))

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_status=Motorcycle.StockStatus.IN_STOCK)
        return queryset

    def filter_search(self, queryset, name, value):
        for term in value.split():
            queryset = queryset.filter(Q(model__icontains=term) | Q(brand__name__icontains=term))
        return queryset
