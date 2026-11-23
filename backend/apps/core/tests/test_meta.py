from apps.core.testing import ApiTestCase


class MetaApiTests(ApiTestCase):
    def test_meta(self):
        data = self.client.get("/api/meta/").json()
        self.assertEqual({c["value"] for c in data["service_types"]},
                         {"maintenance", "tires", "diagnostics", "repair"})
        self.assertEqual(len(data["motorcycle_categories"]), 5)
        self.assertIn("workshop", data)

    def test_admin_login_page_in_slovak(self):
        response = self.client.get("/admin/login/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "lang=\"sk\"")

    def test_seed_command(self):
        from django.core.management import call_command

        from apps.catalog.models import Motorcycle

        call_command("seed_demo", "--no-images", verbosity=0, stdout=open("/dev/null", "w"))
        self.assertGreater(Motorcycle.objects.count(), 20)
