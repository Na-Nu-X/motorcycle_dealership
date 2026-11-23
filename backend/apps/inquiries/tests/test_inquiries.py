from apps.core.testing import CUSTOMER, ApiTestCase, make_bike
from apps.inquiries.models import ContactMessage, VehicleInquiry


class InquiryApiTests(ApiTestCase):
    def test_vehicle_inquiry(self):
        bike = make_bike()
        response = self.client.post(
            "/api/inquiries/", {**CUSTOMER, "motorcycle": bike.slug, "inquiry_type": "reservation",
                                "message": "Chcem rezervovať."}, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(VehicleInquiry.objects.get().inquiry_type, "reservation")

    def test_contact_message(self):
        data = {"name": "Eva", "email": "eva@example.sk", "subject": "Otázka", "message": "Máte otvorené v sobotu?",
                "gdpr_consent": True}
        self.assertEqual(self.client.post("/api/contact/", data, format="json").status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_contact_validation(self):
        response = self.client.post("/api/contact/", {"name": "Eva", "email": "zle", "subject": "x", "message": "krátka",
                                                      "gdpr_consent": False}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.json()), {"email", "message", "gdpr_consent"})

    def test_honeypot(self):
        data = {"name": "Bot", "email": "bot@example.com", "subject": "Buy", "message": "Cheap pills here!!!",
                "gdpr_consent": True, "website": "spam.example"}
        self.assertEqual(self.client.post("/api/contact/", data, format="json").status_code, 400)
        self.assertFalse(ContactMessage.objects.exists())

    def test_rate_limit(self):
        data = {"name": "Eva", "email": "eva@example.sk", "subject": "Otázka", "message": "Dlhšia testovacia správa",
                "gdpr_consent": True}
        codes = [self.client.post("/api/contact/", data, format="json").status_code for _ in range(6)]
        self.assertEqual(codes[:5], [201] * 5)
        self.assertEqual(codes[5], 429)
        # reading endpoints are never throttled
        self.assertEqual(self.client.get("/api/meta/").status_code, 200)
