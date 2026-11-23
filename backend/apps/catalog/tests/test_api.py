from decimal import Decimal

from apps.core.testing import ApiTestCase, make_bike, make_brand


class MotorcycleApiTests(ApiTestCase):
    @classmethod
    def setUpTestData(cls):
        ducati, bmw, honda = make_brand("Ducati"), make_brand("BMW"), make_brand("Honda")
        cls.panigale = make_bike(brand=ducati, model="Panigale", category="sport", engine_cc=955, price=21000,
                                 featured=True)
        cls.gs = make_bike(brand=bmw, model="R 1300 GS", category="adventure", engine_cc=1300, price=24800)
        cls.used_gs = make_bike(brand=bmw, model="F 850 GS", category="adventure", engine_cc=853, price=8900,
                                used=True, mileage_km=20000)
        cls.rebel = make_bike(brand=honda, model="Rebel", category="cruiser", engine_cc=471, price=6400,
                              license_category="A2")
        cls.hidden = make_bike(brand=honda, model="Hidden", category="naked", available=False)

    def slugs(self, response):
        self.assertEqual(response.status_code, 200, response.content)
        return {row["slug"] for row in response.json()["results"]}

    def test_list_hides_unavailable(self):
        slugs = self.slugs(self.client.get("/api/motorcycles/"))
        self.assertEqual(len(slugs), 4)
        self.assertNotIn(self.hidden.slug, slugs)

    def test_filter_by_multiple_categories(self):
        slugs = self.slugs(self.client.get("/api/motorcycles/?category=sport,cruiser"))
        self.assertEqual(slugs, {self.panigale.slug, self.rebel.slug})

    def test_filter_by_brand_slug(self):
        slugs = self.slugs(self.client.get("/api/motorcycles/?brand=bmw"))
        self.assertEqual(slugs, {self.gs.slug, self.used_gs.slug})

    def test_filter_price_range(self):
        slugs = self.slugs(self.client.get("/api/motorcycles/?price_min=8000&price_max=22000"))
        self.assertEqual(slugs, {self.panigale.slug, self.used_gs.slug})

    def test_filter_engine_range(self):
        slugs = self.slugs(self.client.get("/api/motorcycles/?cc_min=900&cc_max=1000"))
        self.assertEqual(slugs, {self.panigale.slug})

    def test_filter_condition(self):
        self.assertEqual(self.slugs(self.client.get("/api/motorcycles/?condition=used")), {self.used_gs.slug})
        self.assertNotIn(self.used_gs.slug, self.slugs(self.client.get("/api/motorcycles/?condition=new")))

    def test_invalid_condition_is_rejected(self):
        self.assertEqual(self.client.get("/api/motorcycles/?condition=broken").status_code, 400)

    def test_combined_filters(self):
        slugs = self.slugs(self.client.get("/api/motorcycles/?category=adventure&brand=bmw&condition=new"))
        self.assertEqual(slugs, {self.gs.slug})

    def test_license_filter(self):
        self.assertEqual(self.slugs(self.client.get("/api/motorcycles/?license=A2")), {self.rebel.slug})

    def test_search(self):
        self.assertEqual(self.slugs(self.client.get("/api/motorcycles/?q=bmw 1300")), {self.gs.slug})

    def test_ordering_by_price(self):
        rows = self.client.get("/api/motorcycles/?ordering=price").json()["results"]
        prices = [Decimal(r["price"]) for r in rows]
        self.assertEqual(prices, sorted(prices))

    def test_detail_contains_specs(self):
        response = self.client.get(f"/api/motorcycles/{self.gs.slug}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for key in ("weight_kg", "seat_height_mm", "fuel_capacity_l", "abs", "images", "transmission_label"):
            self.assertIn(key, data)

    def test_detail_of_hidden_bike_is_404(self):
        self.assertEqual(self.client.get(f"/api/motorcycles/{self.hidden.slug}/").status_code, 404)

    def test_facets(self):
        data = self.client.get("/api/motorcycles/facets/").json()
        self.assertEqual(data["cc_min"], 471)
        self.assertEqual(data["cc_max"], 1300)
        self.assertEqual(data["conditions"], {"new": 3, "used": 1})
        adventure = next(c for c in data["categories"] if c["value"] == "adventure")
        self.assertEqual(adventure["count"], 2)

    def test_similar_excludes_self(self):
        data = self.client.get(f"/api/motorcycles/{self.gs.slug}/similar/").json()
        self.assertEqual([b["slug"] for b in data], [self.used_gs.slug])

    def test_brands_only_with_available_bikes(self):
        make_brand("Empty")
        names = {b["name"] for b in self.client.get("/api/brands/").json()}
        self.assertEqual(names, {"Ducati", "BMW", "Honda"})


class MotorcycleModelTests(ApiTestCase):
    def test_power_kw_and_slug_are_derived(self):
        bike = make_bike(model="Monster", power_hp=Decimal("111"), year=2023)
        self.assertEqual(bike.power_kw, Decimal("82.8"))
        self.assertEqual(bike.slug, "ducati-monster-2023")
        twin = make_bike(model="Monster", year=2023)
        self.assertEqual(twin.slug, "ducati-monster-2023-2")
