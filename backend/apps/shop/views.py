from rest_framework import mixins, status, viewsets
from rest_framework.response import Response

from apps.core.mixins import PublicFormMixin
from apps.core.notifications import notify_staff

from .filters import AccessoryFilter
from .models import Accessory
from .serializers import AccessorySerializer, OrderCreateSerializer


class AccessoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AccessorySerializer
    filterset_class = AccessoryFilter
    lookup_field = "slug"
    ordering_fields = ["price", "name", "created_at"]
    ordering = ["-featured", "name"]
    search_fields: list[str] = []

    def get_queryset(self):
        return Accessory.objects.filter(active=True)


class OrderViewSet(PublicFormMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        notify_staff(f"Nová objednávka {order.number}", f"{order.customer_name}, {order.email}, {order.total} €")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
