from decimal import Decimal

from apps.core.testing import CUSTOMER, ApiTestCase, make_bike
from apps.shop.models import Accessory, Order


class AccessoryApiTests(ApiTestCase):
    def test_filters(self):
        Accessory.objects.create(name="Prilba", category="helmets", price=Decimal("300"), stock=2)
        Accessory.objects.create(name="Olej", category="maintenance", price=Decimal("50"), stock=0)
        Accessory.objects.create(name="Skrytá", category="helmets", price=Decimal("10"), stock=5, active=False)
        names = lambda q: {r["name"] for r in self.client.get(f"/api/accessories/{q}").json()["results"]}  # noqa
        self.assertEqual(names(""), {"Prilba", "Olej"})
        self.assertEqual(names("?category=helmets"), {"Prilba"})
        self.assertEqual(names("?in_stock=true"), {"Prilba"})
        self.assertEqual(names("?price_max=100"), {"Olej"})


class OrderApiTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.helmet = Accessory.objects.create(
            name="Prilba", category="helmets", price=Decimal("100.00"), stock=3, sizes="S, M, L", colors="Čierna"
        )
        self.oil = Accessory.objects.create(name="Olej", category="maintenance", price=Decimal("20.00"), stock=10)

    def payload(self, **overrides):
        data = {
            **CUSTOMER,
            "delivery_method": "pickup",
            "items": [
                {"accessory": self.helmet.pk, "quantity": 1, "size": "M", "color": "Čierna"},
                {"accessory": self.oil.pk, "quantity": 2},
            ],
        }
        data.update(overrides)
        return data

    def test_order_success_decrements_stock(self):
        response = self.client.post("/api/orders/", self.payload(), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["total"], "140.00")
        order = Order.objects.get(number=response.json()["number"])
        self.assertEqual(order.items.count(), 2)
        self.helmet.refresh_from_db()
        self.oil.refresh_from_db()
        self.assertEqual((self.helmet.stock, self.oil.stock), (2, 8))

    def test_courier_shipping_and_address_required(self):
        response = self.client.post("/api/orders/", self.payload(delivery_method="courier"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("street", response.json())
        address = {"street": "Hlavná 1", "city": "Bratislava", "postal_code": "811 01"}
        response = self.client.post(
            "/api/orders/", self.payload(delivery_method="courier", items=[{"accessory": self.oil.pk, "quantity": 1}],
                                         **address), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["shipping_price"], "6.90")
        self.assertEqual(response.json()["total"], "26.90")

    def test_free_shipping_over_threshold(self):
        address = {"street": "Hlavná 1", "city": "Košice", "postal_code": "040 01"}
        items = [{"accessory": self.helmet.pk, "quantity": 2, "size": "S", "color": "Čierna"}]
        response = self.client.post("/api/orders/", self.payload(delivery_method="courier", items=items, **address),
                                    format="json")
        self.assertEqual(response.json()["shipping_price"], "0.00")

    def test_insufficient_stock(self):
        items = [{"accessory": self.helmet.pk, "quantity": 2, "size": "S", "color": "Čierna"},
                 {"accessory": self.helmet.pk, "quantity": 2, "size": "M", "color": "Čierna"}]
        response = self.client.post("/api/orders/", self.payload(items=items), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("items", response.json())
        self.helmet.refresh_from_db()
        self.assertEqual(self.helmet.stock, 3)
        self.assertFalse(Order.objects.exists())

    def test_invalid_size_rejected(self):
        items = [{"accessory": self.helmet.pk, "quantity": 1, "size": "XXXL", "color": "Čierna"}]
        self.assertEqual(self.client.post("/api/orders/", self.payload(items=items), format="json").status_code, 400)

    def test_empty_cart_rejected(self):
        self.assertEqual(self.client.post("/api/orders/", self.payload(items=[]), format="json").status_code, 400)

    def test_honeypot_rejected(self):
        response = self.client.post("/api/orders/", self.payload(website="http://spam"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("website", response.json())
        self.assertFalse(Order.objects.exists())

    def test_gdpr_required(self):
        response = self.client.post("/api/orders/", self.payload(gdpr_consent=False), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("gdpr_consent", response.json())

    def test_order_numbers_are_sequential(self):
        a = self.client.post("/api/orders/", self.payload(), format="json").json()["number"]
        b = self.client.post("/api/orders/", self.payload(), format="json").json()["number"]
        self.assertEqual(int(b) - int(a), 1)

    def test_motorcycle_reservation_only(self):
        bike = make_bike(model="Monster")
        response = self.client.post(
            "/api/orders/", self.payload(items=[], motorcycles=[bike.slug], delivery_method="courier"), format="json"
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["reserved_motorcycles"], [bike.title])
        order = Order.objects.get()
        self.assertEqual(order.delivery_method, "pickup")
        self.assertEqual(order.total, Decimal("0"))

    def test_mixed_cart(self):
        bike = make_bike(model="Monster")
        response = self.client.post("/api/orders/", self.payload(motorcycles=[bike.slug]), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(Order.objects.get().reserved_motorcycles.count(), 1)

    def test_sold_motorcycle_cannot_be_reserved(self):
        bike = make_bike(model="Monster", stock_status="sold")
        response = self.client.post("/api/orders/", self.payload(items=[], motorcycles=[bike.slug]), format="json")
        self.assertIn("motorcycles", response.json())

    def test_too_many_motorcycles(self):
        slugs = [make_bike(model=f"Bike {i}").slug for i in range(4)]
        response = self.client.post("/api/orders/", self.payload(items=[], motorcycles=slugs), format="json")
        self.assertIn("motorcycles", response.json())
