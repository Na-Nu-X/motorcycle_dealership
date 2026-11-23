# MotoVault – premium motorcycle dealership

A full-stack web application for a high-end motorcycle dealership. It covers a motorcycle catalog with
URL-synced filters, vehicle detail pages with a lightbox gallery, an accessories shop with a persistent cart,
online service booking, a test-ride wizard, contact with a GDPR-friendly map, and a **Slovak-localized
Django admin** (Unfold).

| Layer    | Stack |
|----------|-------|
| Backend  | Django 6, Django REST Framework, django-filter, Unfold admin, SQLite / PostgreSQL (`DATABASE_URL`) |
| Frontend | Angular 22 (standalone components, Signals, Signal Forms, `httpResource`, zoneless), pure SCSS |

```
motorcycle_dealership/
├── backend/                 Django project
│   ├── config/              settings, urls, API router
│   ├── apps/
│   │   ├── core/            shared models, anti-spam, booking rules, admin dashboard, seed command
│   │   ├── catalog/         Brand, Motorcycle, MotorcycleImage + filters
│   │   ├── shop/            Accessory, Order, OrderItem (+ motorcycle reservations)
│   │   ├── bookings/        ServiceBooking, TestRideBooking
│   │   └── inquiries/       VehicleInquiry, ContactMessage
│   ├── locale/sk/           Slovak strings for Unfold's UI
│   └── templates/admin/     admin dashboard
├── frontend/                Angular app
│   └── src/
│       ├── site.config.ts   ← brand, contacts, opening hours, map, API URL
│       ├── styles/          ← design tokens (_tokens.scss) + global SCSS
│       └── app/
│           ├── core/        API models/service, cart, SEO, utilities (pluralization, formatting)
│           ├── shared/      UI components, pipes, Signal Forms helpers
│           ├── layout/      header, footer, toasts
│           └── features/    one folder per page
└── .env.example             all backend environment variables
```

---

## 1. Requirements

- Python **3.12+** (tested on 3.14)
- Node.js **20.19+ / 22.12+** and npm (tested on Node 22, npm 10)
- Optional: PostgreSQL 14+

## 2. Installation

```bash
git clone <repo> motorcycle_dealership
cd motorcycle_dealership
cp .env.example .env            # adjust values as needed
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate         # create the database schema
python manage.py seed_demo       # optional: demo motorcycles, gear and bookings (with generated photos)
python manage.py createsuperuser # admin account
```

### Frontend

```bash
cd frontend
npm install                      # .npmrc sets legacy-peer-deps (works around an npm 10 peer-resolution bug)
```

## 3. Running both servers

Open two terminals:

```bash
# Terminal 1 – API + admin on http://127.0.0.1:8000
cd backend && source .venv/bin/activate
python manage.py runserver

# Terminal 2 – website on http://localhost:4200
cd frontend
npm start                        # = ng serve, proxies /api, /media and /admin to Django (proxy.conf.json)
```

| URL | What |
|-----|------|
| http://localhost:4200 | Website |
| http://localhost:8000/admin/ | Slovak admin (Unfold) |
| http://localhost:8000/api/ | Browsable REST API (DEBUG only) |

## 4. Database & migrations

SQLite (`backend/db.sqlite3`) is used when `DATABASE_URL` is empty. For PostgreSQL:

```bash
# .env
DATABASE_URL=postgres://motovault:password@localhost:5432/motovault
```

```bash
python manage.py migrate                 # apply migrations
python manage.py makemigrations          # after changing models
python manage.py seed_demo --reset       # wipe and re-create demo data
python manage.py seed_demo --no-images   # faster, without generated photos
```

## 5. Tests & quality checks

```bash
# Backend – 66 tests: API filters, orders/stock, booking validation, honeypot, rate limiting, admin smoke tests
cd backend && python manage.py test
python manage.py check
DJANGO_DEBUG=false DJANGO_SECRET_KEY=... python manage.py check --deploy

# Frontend – unit tests (Vitest): pluralization, URL ↔ filter mapping, cart, server errors, booking rules
cd frontend && npx ng test --watch=false
npx ng build                             # production build, zero errors/warnings
```

The frontend compiler is strict: `strict`, `strictTemplates` and Angular's extended diagnostics are treated
as errors, so a warning fails the build.

---

## 6. Features

### Catalog & filters
- Filter by category, brand, price range, engine size, condition (new/used), A2 licence and full-text search.
- **The URL is the single source of truth.** Filters are serialized to Slovak query params, so any filtered
  view can be shared or bookmarked, e.g.
  `/motocykle?kategoria=adventure,naked&znacka=bmw-motorrad&cena_do=20000&stav=jazdene&zoradit=cena-vzostupne`.
  The mapping lives in `features/catalog/catalog-filters.ts` and is unit-tested.
- Facet counts (`/api/motorcycles/facets/`), active-filter chips, sorting, pagination, and a mobile filter drawer.

### Vehicle detail
Full specification table, gallery with an accessible lightbox (native `<dialog>`, keyboard arrows, swipe),
**"Rezervovať testovaciu jazdu"**, **"Mám záujem"** (inquiry form: interest / reservation / financing / trade-in),
**"Rezervovať do košíka"**, and similar motorcycles.

### Cart & orders
- The cart is persisted in `localStorage` and holds gear (size/colour variants, stock-limited quantities)
  plus up to 3 **motorcycle reservation requests**.
- Checkout creates one `Order` with items and reserved motorcycles. The backend locks stock rows
  (`select_for_update`), validates sizes and colours, and calculates shipping (free above 150 €).

### Bookings
- **Service:** service type, motorcycle, date, and a live half-hour slot picker (`/availability/`) with capacity per slot.
- **Test ride:** a 4-step wizard (motorcycle → date/time → rider → contact). It requires a confirmed valid licence,
  checks that the licence category fits the motorcycle, and prevents double-booking the same bike and slot.
- Shared rules: at least 1 day ahead, at most 90 days, Mon–Fri 8–17, Sat 8–12, closed on Sunday.
  The rules are enforced server-side and mirrored client-side.

### Spam protection
Every public form has a **honeypot** field (`website`) and **rate limiting**: 5 submissions per minute per IP,
configurable with `FORMS_THROTTLE_RATE`. Read endpoints are never throttled. GDPR consent is required on all forms.

### UX & accessibility
- Slovak pluralization (`1 motocykel / 2 motocykle / 5 motocyklov`) via `| plural` (`core/utils/plural.ts`).
- Prices use Slovak formatting and tabular figures (`10 990 €`).
- Skip link, focus management on navigation, visible focus rings, labelled controls, and errors linked with
  `aria-describedby`. Live regions announce results and toasts, and `prefers-reduced-motion` is respected.
- Verified with no horizontal overflow at 320 / 375 / 768 / 1440 px.
- The OpenStreetMap embed on the contact page is **click-to-load**: no third-party request is made before consent,
  and the visitor can choose to remember the choice. Fonts are self-hosted (`@fontsource`).

### Admin (Unfold, Slovak)
- Dashboard with KPIs and upcoming service and test-ride appointments.
- Sidebar badges with counts of new orders, bookings and inquiries.
- Toggle switches (`available`, `featured`, `new_arrival`, `used`) and an inline photo gallery.
- Range, checkbox and date filters, plus bulk status actions (confirm / complete / cancel).
- The admin is always Slovak, whatever the browser's language. Unfold strings not covered by Django are in
  `backend/locale/sk/LC_MESSAGES/django.po`. After editing that file, recompile with
  `python scripts/compile_messages.py`, or with `python manage.py compilemessages` if GNU gettext is installed.

---

## 7. API overview

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/meta/` | enumerations, shipping prices, workshop hours |
| GET | `/api/brands/` | brands with available motorcycles |
| GET | `/api/motorcycles/` | `category`, `brand` (comma lists), `price_min/max`, `cc_min/max`, `condition=new\|used`, `license`, `featured`, `new_arrival`, `q`, `ordering`, `page`, `page_size` |
| GET | `/api/motorcycles/facets/` | filter ranges & counts |
| GET | `/api/motorcycles/{slug}/` · `/similar/` | detail, similar bikes |
| GET | `/api/accessories/` · `/{slug}/` | `category`, `price_min/max`, `in_stock`, `q`, `ordering` |
| POST | `/api/orders/` | `items[]`, `motorcycles[]` (slugs), contact, delivery |
| GET/POST | `/api/service-bookings/availability/?date=` · `/api/service-bookings/` | |
| GET/POST | `/api/test-rides/availability/?date=&motorcycle=` · `/api/test-rides/` | |
| POST | `/api/inquiries/` · `/api/contact/` | |

---

## 8. Re-branding

1. **Name, contacts, hours, map, social links:** edit `frontend/src/site.config.ts`. The logo splits a CamelCase
   name automatically ("Moto" + accent "Vault"). Set `SITE_NAME` in `.env` for the admin title and e-mails.
2. **Colours, fonts, spacing, radii:** edit the CSS custom properties in `frontend/src/styles/_tokens.scss`.
   For example, `--color-accent: #ff6a00;` switches the racing-red accent to orange; use a lighter
   `--color-accent-text` for text on black.
   Fonts are loaded in `angular.json → styles`: swap the `@fontsource/*` packages and update `--font-display` / `--font-body`.
3. **Admin colours:** `UNFOLD["COLORS"]["primary"]` in `backend/config/settings.py`.
4. **Favicon / logo:** `frontend/public/favicon.svg` and `frontend/src/app/layout/logo.ts`.
5. **Page copy:** each page lives in `frontend/src/app/features/<page>/`.

## 9. Production deployment notes

- Set `DJANGO_DEBUG=false`, a strong `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `FRONTEND_URL`,
  CORS/CSRF origins and SMTP settings.
- Backend: `python manage.py collectstatic`, then run with a WSGI server (e.g. `gunicorn config.wsgi`).
- Frontend: `npx ng build` and serve `frontend/dist/frontend/browser/` as a SPA (fallback to `index.html`).
- Reverse proxy: route `/api/`, `/admin/` and `/static/` to Django, serve `/media/` from `DJANGO_MEDIA_ROOT`, and
  everything else from the Angular build. With this same-origin setup, `apiBaseUrl: '/api'` in `site.config.ts`
  needs no change. For a separate API domain, set `apiBaseUrl` to the full URL and list the site in `CORS_ALLOWED_ORIGINS`.
- If running behind more than one proxy, configure DRF's `NUM_PROXIES` so rate limiting sees real client IPs.

## 10. Git workflow

Development happens on the `claude` branch with incremental commits. `main` is never committed to directly.
