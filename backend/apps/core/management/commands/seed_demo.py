"""Populate the database with demo data: ``python manage.py seed_demo [--reset]``.

Photos are generated locally with Pillow (no network access needed).
"""

import io
import random
from datetime import time, timedelta
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from apps.bookings.models import ServiceBooking, TestRideBooking
from apps.catalog.models import Brand, Motorcycle, MotorcycleImage
from apps.inquiries.models import ContactMessage, VehicleInquiry
from apps.shop.models import Accessory, Order

BRANDS = [
    ("Ducati", "Taliansko"), ("BMW Motorrad", "Nemecko"), ("KTM", "Rakúsko"), ("Triumph", "Spojené kráľovstvo"),
    ("Honda", "Japonsko"), ("Yamaha", "Japonsko"), ("Kawasaki", "Japonsko"), ("Harley-Davidson", "USA"),
]

# brand, model, year, category, cc, hp, torque, price, used, km, weight, seat, fuel, top, license, extras
BIKES = [
    ("Ducati", "Multistrada V4 S", 2025, "adventure", 1158, 170, 125, 30990, False, 0, 229, 840, 22, 255, "A",
     dict(featured=True, new_arrival=True, quickshifter=True, cruise_control=True)),
    ("Ducati", "Panigale V2", 2024, "sport", 955, 155, 104, 21490, False, 0, 200, 840, 17, 270, "A",
     dict(featured=True, quickshifter=True)),
    ("Ducati", "Monster SP", 2023, "naked", 937, 111, 93, 13900, True, 6400, 186, 820, 14, 240, "A", {}),
    ("Ducati", "Scrambler Icon", 2025, "naked", 803, 73, 65, 10990, False, 0, 176, 795, 15, 200, "A2",
     dict(new_arrival=True)),
    ("BMW Motorrad", "R 1300 GS", 2025, "adventure", 1300, 145, 149, 24800, False, 0, 237, 850, 19, 225, "A",
     dict(featured=True, new_arrival=True, cruise_control=True, quickshifter=True)),
    ("BMW Motorrad", "S 1000 RR", 2024, "sport", 999, 210, 113, 25990, False, 0, 197, 832, 16.5, 303, "A",
     dict(quickshifter=True)),
    ("BMW Motorrad", "R 18 Classic", 2022, "cruiser", 1802, 91, 158, 19900, True, 12800, 365, 710, 16, 180, "A",
     dict(cruise_control=True, transmission="manual")),
    ("BMW Motorrad", "C 400 X", 2024, "scooter", 350, 34, 35, 7690, False, 0, 206, 775, 12.8, 139, "A2",
     dict(transmission="cvt")),
    ("KTM", "1290 Super Adventure S", 2023, "adventure", 1301, 160, 138, 17900, True, 18500, 244, 849, 23, 240, "A",
     dict(cruise_control=True)),
    ("KTM", "390 Duke", 2025, "naked", 399, 45, 39, 6290, False, 0, 165, 820, 15, 170, "A2",
     dict(new_arrival=True, quickshifter=True)),
    ("KTM", "890 Duke R", 2024, "naked", 889, 121, 99, 12490, False, 0, 166, 834, 14, 230, "A",
     dict(quickshifter=True)),
    ("Triumph", "Tiger 900 Rally Pro", 2024, "adventure", 888, 108, 90, 17490, False, 0, 228, 860, 20, 210, "A",
     dict(cruise_control=True, quickshifter=True)),
    ("Triumph", "Speed Triple 1200 RS", 2025, "naked", 1160, 180, 128, 20990, False, 0, 199, 830, 15.5, 260, "A",
     dict(featured=True, quickshifter=True)),
    ("Triumph", "Bonneville T120", 2021, "cruiser", 1200, 80, 105, 10490, True, 21400, 236, 790, 14.5, 190, "A",
     dict(cooling="liquid")),
    ("Honda", "CRF1100L Africa Twin", 2024, "adventure", 1084, 102, 112, 17290, False, 0, 238, 850, 18.8, 200, "A",
     dict(transmission="dct", cruise_control=True)),
    ("Honda", "CBR650R", 2025, "sport", 649, 95, 63, 9990, False, 0, 209, 810, 15.4, 220, "A",
     dict(new_arrival=True)),
    ("Honda", "Rebel 500", 2023, "cruiser", 471, 46, 43, 6390, True, 3200, 191, 690, 11.2, 160, "A2", {}),
    ("Honda", "Forza 750", 2024, "scooter", 745, 59, 69, 11490, False, 0, 235, 790, 13.2, 175, "A2",
     dict(transmission="dct")),
    ("Yamaha", "Ténéré 700", 2025, "adventure", 689, 73, 68, 11490, False, 0, 205, 875, 16, 195, "A2",
     dict(featured=True)),
    ("Yamaha", "MT-09", 2024, "naked", 890, 119, 93, 10890, False, 0, 193, 825, 14, 230, "A",
     dict(quickshifter=True)),
    ("Yamaha", "YZF-R7", 2023, "sport", 689, 73, 67, 8490, True, 4100, 188, 835, 13, 210, "A2", {}),
    ("Yamaha", "XMAX 300", 2025, "scooter", 292, 28, 29, 6390, False, 0, 180, 795, 13, 135, "A2",
     dict(transmission="cvt")),
    ("Kawasaki", "Ninja ZX-10R", 2024, "sport", 998, 203, 114, 21990, False, 0, 207, 835, 17, 299, "A",
     dict(quickshifter=True)),
    ("Kawasaki", "Z900", 2022, "naked", 948, 125, 98, 7990, True, 15600, 212, 820, 17, 240, "A", {}),
    ("Kawasaki", "Vulcan S", 2024, "cruiser", 649, 61, 63, 7690, False, 0, 229, 705, 14, 190, "A2", {}),
    ("Harley-Davidson", "Fat Boy 114", 2024, "cruiser", 1868, 94, 155, 27490, False, 0, 317, 675, 18.9, 180, "A",
     dict(featured=True, cruise_control=True, cooling="air_oil")),
    ("Harley-Davidson", "Pan America 1250 Special", 2022, "adventure", 1252, 152, 128, 16990, True, 9800, 258, 850,
     21.2, 225, "A", dict(cruise_control=True)),
    ("Harley-Davidson", "Street Bob 114", 2023, "cruiser", 1868, 94, 155, 19490, True, 5400, 297, 680, 13.2, 180,
     "A", dict(cooling="air_oil")),
]

ACCESSORIES = [
    ("Prilba Shoei NXR2", "Shoei", "helmets", "589.00", "XS, S, M, L, XL", "Matná čierna, Biela, Červená", 8,
     "Prémiová integrálna prilba s ECE 22.06 homologizáciou a Pinlock fóliou.", True),
    ("Prilba Arai Tour-X5", "Arai", "helmets", "749.00", "S, M, L, XL", "Biela, Frost Black", 4,
     "Dobrodružná prilba so štítom a slnečnou clonou pre dlhé trasy.", False),
    ("Prilba HJC RPHA 71", "HJC", "helmets", "419.00", "S, M, L, XL, XXL", "Matná čierna, Sivá", 0,
     "Ľahká športovo-cestovná prilba z kompozitu PIM+.", False),
    ("Kožená bunda Dainese Racing 4", "Dainese", "jackets", "549.00", "48, 50, 52, 54, 56", "Čierna, Čierna/Červená",
     6, "Športová kožená bunda s chráničmi ramien a lakťov.", True),
    ("Textilná bunda Rev'it Sand 4 H2O", "Rev'it", "jackets", "479.00", "S, M, L, XL, XXL", "Čierna, Piesková",
     10, "Vodeodolná adventure bunda s odnímateľnou termovložkou.", False),
    ("Rukavice Alpinestars SP-8 v3", "Alpinestars", "gloves", "139.00", "S, M, L, XL", "Čierna, Čierna/Červená",
     15, "Kožené športové rukavice s chráničmi kĺbov.", False),
    ("Topánky TCX Street 3 WP", "TCX", "boots", "199.00", "40, 41, 42, 43, 44, 45, 46", "Čierna", 7,
     "Vodeodolné mestské topánky s ochranou členkov.", False),
    ("Motorkárske nohavice Held Dragon", "Held", "jackets", "289.00", "S, M, L, XL", "Čierna", 5,
     "Kevlarové džínsy s chráničmi kolien.", False),
    ("Výfuk Akrapovič Slip-On", "Akrapovič", "parts", "1290.00", "", "Titan, Karbón", 2,
     "Titánový koncový tlmič so zníženou hmotnosťou a športovým zvukom.", True),
    ("LED prídavné svetlá Denali D4", "Denali", "parts", "629.00", "", "", 3,
     "Výkonné LED svetlá pre adventure motocykle.", False),
    ("Bočné kufre SW-Motech TRAX ADV", "SW-Motech", "parts", "899.00", "", "Strieborná, Čierna", 2,
     "Hliníkové kufre 37 l + 45 l vrátane zámkov.", False),
    ("Kryt motora Rizoma", "Rizoma", "parts", "189.00", "", "Čierna, Strieborná", 0,
     "Frézovaný hliníkový kryt alternátora.", False),
    ("Motul 7100 4T 10W-40 (4 l)", "Motul", "maintenance", "64.90", "", "", 40,
     "100 % syntetický motorový olej pre štvortaktné motory.", False),
    ("Sprej na reťaz Motul C4", "Motul", "maintenance", "14.90", "", "", 55,
     "Mazivo na reťaz pre cestné motocykle.", False),
    ("Sada na čistenie motocykla Muc-Off", "Muc-Off", "maintenance", "49.90", "", "", 0,
     "Kompletná sada čističov, kefiek a ochranného spreju.", False),
    ("Nabíjačka batérie Optimate 4", "TecMate", "maintenance", "79.00", "", "", 12,
     "Inteligentná nabíjačka a udržiavač batérie.", False),
]

PALETTES = [((20, 20, 22), (58, 60, 66)), ((15, 15, 16), (90, 22, 20)), ((25, 25, 28), (60, 66, 74))]


def render_placeholder(title: str, subtitle: str, variant: int = 0, size=(1600, 1000)) -> bytes:
    """Draw an industrial-styled placeholder photo."""
    w, h = size
    top, bottom = PALETTES[variant % len(PALETTES)]
    img = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        draw.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    # diagonal racing stripes
    accent = (226, 35, 26)
    offset = 220 * variant
    for i, width in enumerate((70, 22)):
        x0 = w - 700 + offset + i * 110
        draw.polygon([(x0, 0), (x0 + width, 0), (x0 - 500 + width, h), (x0 - 500, h)], fill=accent)
    # stylised motorcycle silhouette (relative coordinates)
    def pt(x, y):
        return (w * x, h * y)

    steel, dark = (205, 205, 210), (40, 40, 44)
    for cx in (0.30, 0.70):
        r = h * 0.17
        cx_, cy_ = w * cx, h * 0.70
        draw.ellipse([cx_ - r, cy_ - r, cx_ + r, cy_ + r], fill=dark, outline=steel, width=26)
        draw.ellipse([cx_ - r * 0.55, cy_ - r * 0.55, cx_ + r * 0.55, cy_ + r * 0.55], outline=steel, width=6)
        draw.ellipse([cx_ - r * 0.14, cy_ - r * 0.14, cx_ + r * 0.14, cy_ + r * 0.14], fill=steel)
    draw.line([pt(0.70, 0.70), pt(0.62, 0.36)], fill=steel, width=22)            # fork
    draw.line([pt(0.30, 0.70), pt(0.46, 0.56)], fill=steel, width=18)            # swingarm
    draw.polygon([pt(0.40, 0.44), pt(0.62, 0.40), pt(0.60, 0.58), pt(0.44, 0.62)], fill=(120, 122, 130))  # engine
    draw.polygon([pt(0.47, 0.40), pt(0.52, 0.31), pt(0.63, 0.31), pt(0.64, 0.40)], fill=accent)            # tank
    draw.polygon([pt(0.28, 0.40), pt(0.47, 0.37), pt(0.47, 0.41), pt(0.30, 0.44)], fill=(30, 30, 32))      # seat
    draw.line([pt(0.60, 0.29), pt(0.66, 0.26)], fill=steel, width=12)            # handlebar
    draw.line([pt(0.44, 0.60), pt(0.24, 0.55)], fill=(150, 150, 155), width=14)  # exhaust
    font_big = ImageFont.load_default(size=88)
    font_small = ImageFont.load_default(size=44)
    draw.text((80, 70), title.upper(), fill=(245, 245, 245), font=font_big)
    draw.text((84, 180), subtitle, fill=(190, 190, 195), font=font_small)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=82, optimize=True)
    return buf.getvalue()


class Command(BaseCommand):
    help = "Naplní databázu ukážkovými dátami (motocykle, príslušenstvo, rezervácie)."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Pred naplnením zmaže existujúce dáta.")
        parser.add_argument("--no-images", action="store_true", help="Negenerovať obrázky (rýchlejšie, pre testy).")

    @transaction.atomic
    def handle(self, *args, reset=False, no_images=False, **options):
        if reset:
            for img in MotorcycleImage.objects.all():
                img.image.delete(save=False)
            for acc in Accessory.objects.exclude(image=""):
                acc.image.delete(save=False)
            for model in (TestRideBooking, ServiceBooking, VehicleInquiry, ContactMessage, Order, Accessory,
                          MotorcycleImage, Motorcycle, Brand):
                model.objects.all().delete()
        elif Motorcycle.objects.exists():
            self.stdout.write(self.style.WARNING("Dáta už existujú – použite --reset na ich prepísanie."))
            return

        random.seed(42)
        brands = {}
        for order, (name, country) in enumerate(BRANDS):
            brands[name], _ = Brand.objects.get_or_create(name=name, defaults={"country": country, "order": order})

        bikes = []
        for (brand, model, year, cat, cc, hp, tq, price, used, km, weight, seat, fuel, top, lic, extra) in BIKES:
            stock = "in_stock"
            if not used and random.random() < 0.2:
                stock = random.choice(["on_order", "in_transit"])
            bike = Motorcycle.objects.create(
                brand=brands[brand], model=model, year=year, category=cat, engine_cc=cc,
                power_hp=Decimal(hp), torque_nm=Decimal(tq), price=Decimal(price),
                previous_price=Decimal(price + 1200) if random.random() < 0.2 else None,
                used=used, mileage_km=km, weight_kg=weight, seat_height_mm=seat, fuel_capacity_l=Decimal(str(fuel)),
                top_speed_kmh=top, license_category=lic, stock_status=stock,
                engine_type=random.choice(["2-valec do V, 4T", "Radový 4-valec, 4T", "Boxer 2-valec, 4T",
                                           "Radový 3-valec, 4T", "Radový 2-valec, 4T"]) if cat != "scooter"
                else "1-valec, 4T",
                gears=None if extra.get("transmission") == "cvt" else 6,
                color=random.choice(["Racing Red", "Matná čierna", "Biela/Modrá", "Grafitová", "Strieborná"]),
                riding_modes=hp > 70, traction_control=hp > 90, abs=True,
                short_description=f"{dict(Motorcycle.Category.choices)[cat]} s motorom {cc} cm³ a výkonom {hp} k.",
                description=(
                    f"<p>{brand} {model} spája charakter, technológie a spoľahlivosť. "
                    f"Motor s objemom {cc} cm³ ponúka {hp} k a {tq} Nm krútiaceho momentu.</p>"
                    "<p>Motocykel prešiel vstupnou kontrolou v našom servise a je pripravený na okamžité odovzdanie. "
                    "Ponúkame financovanie, protiúčet aj predĺženú záruku.</p>"
                ),
                extra_specs={"Predné odpruženie": "USD vidlica", "Záruka": "24 mesiacov" if not used else "12 mesiacov"},
                **extra,
            )
            bikes.append(bike)
            if not no_images:
                for i in range(3):
                    subtitle = f"{year} · {cc} ccm · {hp} k"
                    content = render_placeholder(f"{brand} {model}", subtitle, variant=i)
                    image = MotorcycleImage(motorcycle=bike, alt=f"{bike.title} – fotografia {i + 1}", order=i)
                    image.image.save(f"{bike.slug}-{i + 1}.jpg", ContentFile(content), save=True)

        for name, brand, cat, price, sizes, colors, stock, desc, featured in ACCESSORIES:
            acc = Accessory(name=name, brand=brand, category=cat, price=Decimal(price), sizes=sizes, colors=colors,
                            stock=stock, short_description=desc, description=f"<p>{desc}</p>", featured=featured)
            acc.save()
            if not no_images:
                acc.image.save(f"{acc.slug}.jpg", ContentFile(render_placeholder(name, brand, size=(900, 900))),
                               save=True)

        today = timezone.localdate()
        day = today + timedelta(days=2)
        while day.weekday() >= 5:
            day += timedelta(days=1)
        ServiceBooking.objects.create(
            first_name="Ján", last_name="Novák", email="jan.novak@example.sk", phone="+421 900 111 222",
            motorcycle_model="Honda CB650R", motorcycle_year=2021, mileage_km=18000, service_type="maintenance",
            preferred_date=day, preferred_time=time(9), gdpr_consent=True,
        )
        TestRideBooking.objects.create(
            first_name="Petra", last_name="Kováčová", email="petra@example.sk", phone="+421 905 333 444",
            motorcycle=bikes[0], preferred_date=day, preferred_time=time(14), license_category="A",
            license_confirmed=True, riding_experience_years=6, gdpr_consent=True,
        )
        VehicleInquiry.objects.create(
            first_name="Martin", last_name="Horváth", email="martin@example.sk", phone="+421 911 555 666",
            motorcycle=bikes[4], inquiry_type="financing", message="Dobrý deň, zaujíma ma leasing na 48 mesiacov.",
            gdpr_consent=True,
        )
        self.stdout.write(self.style.SUCCESS(
            f"Hotovo: {len(bikes)} motocyklov, {len(ACCESSORIES)} produktov príslušenstva a ukážkové rezervácie."
        ))
