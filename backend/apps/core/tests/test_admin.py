from django.contrib import admin
from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse


class AdminSmokeTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", "--no-images", verbosity=0, stdout=open("/dev/null", "w"))
        cls.user = User.objects.create_superuser("admin", "admin@example.sk", "pass")

    def setUp(self):
        self.client.force_login(self.user)

    def test_dashboard(self):
        response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Prehľad predajne")

    def test_every_registered_model_renders(self):
        for model in admin.site._registry:
            opts = model._meta
            for view in ("changelist", "add"):
                url = reverse(f"admin:{opts.app_label}_{opts.model_name}_{view}")
                with self.subTest(url=url):
                    self.assertEqual(self.client.get(url).status_code, 200)
            obj = model.objects.first()
            if obj:
                url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
                with self.subTest(url=url):
                    self.assertEqual(self.client.get(url).status_code, 200)

    def test_status_bulk_action(self):
        from apps.bookings.models import ServiceBooking

        booking = ServiceBooking.objects.first()
        response = self.client.post(
            reverse("admin:bookings_servicebooking_changelist"),
            {"action": "mark_confirmed", "_selected_action": [booking.pk]}, follow=True,
        )
        self.assertEqual(response.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")

    def test_filtered_changelist(self):
        url = reverse("admin:catalog_motorcycle_changelist")
        response = self.client.get(url, {"category": "sport", "price_from": "5000", "price_to": "30000"})
        self.assertEqual(response.status_code, 200)

    def test_admin_is_slovak_regardless_of_browser_language(self):
        response = self.client.get(reverse("admin:catalog_motorcycle_changelist"), HTTP_ACCEPT_LANGUAGE="en-US")
        self.assertContains(response, "Filtre")
        self.assertContains(response, "Hľadať aplikácie a modely")
        self.assertNotContains(response, "Type to search")
