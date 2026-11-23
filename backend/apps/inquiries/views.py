from rest_framework import mixins, viewsets

from apps.core.mixins import PublicFormMixin
from apps.core.notifications import notify_staff

from .serializers import ContactMessageSerializer, VehicleInquirySerializer


class VehicleInquiryViewSet(PublicFormMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = VehicleInquirySerializer

    def perform_create(self, serializer):
        inquiry = serializer.save()
        notify_staff("Nový dopyt k vozidlu", str(inquiry))


class ContactMessageViewSet(PublicFormMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = ContactMessageSerializer

    def perform_create(self, serializer):
        message = serializer.save()
        notify_staff("Nová kontaktná správa", f"{message.name} <{message.email}>\n\n{message.message}")
