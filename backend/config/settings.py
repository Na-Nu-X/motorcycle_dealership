"""
Django settings for the MotoVault backend.

All deployment-specific values are read from environment variables
(see ``.env.example`` in the repository root).
"""

from pathlib import Path
import os

import dj_database_url
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

# Load .env from the backend dir first, then the repo root (first wins).
load_dotenv(BASE_DIR / ".env")
load_dotenv(REPO_ROOT / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-insecure-change-me-in-production")
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

SITE_NAME = os.getenv("SITE_NAME", "MotoVault")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4200").rstrip("/")

INSTALLED_APPS = [
    # Unfold must be registered before django.contrib.admin
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "unfold.contrib.inlines",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "django_filters",
    "corsheaders",
    # Local
    "apps.core",
    "apps.catalog",
    "apps.shop",
    "apps.bookings",
    "apps.inquiries",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database: SQLite by default, PostgreSQL (or anything else) via DATABASE_URL.
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=int(os.getenv("DB_CONN_MAX_AGE", "60")),
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Localisation — Slovak first.
LANGUAGE_CODE = "sk"
LANGUAGES = [("sk", "Slovenčina"), ("en", "English")]
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "Europe/Bratislava")
USE_I18N = True
USE_TZ = True
LOCALE_PATHS = [BASE_DIR / "locale"]

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = Path(os.getenv("DJANGO_MEDIA_ROOT", BASE_DIR / "media"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- CORS / CSRF -----------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200")

# --- Security hardening for production ------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

# --- Django REST Framework -------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"]
    + (["rest_framework.renderers.BrowsableAPIRenderer"] if DEBUG else []),
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 12,
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {
        # Public form submissions (orders, bookings, inquiries, contact).
        "forms": os.getenv("FORMS_THROTTLE_RATE", "5/minute"),
    },
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "motovault",
    }
}

# --- Business configuration ------------------------------------------------
# Opening hours of the service workshop used for booking validation.
WORKSHOP_OPEN_HOUR = int(os.getenv("WORKSHOP_OPEN_HOUR", "8"))
WORKSHOP_CLOSE_HOUR = int(os.getenv("WORKSHOP_CLOSE_HOUR", "17"))
# How many days ahead a customer can book (service / test ride).
BOOKING_MAX_DAYS_AHEAD = int(os.getenv("BOOKING_MAX_DAYS_AHEAD", "90"))
# Max number of service bookings per time slot.
SERVICE_SLOT_CAPACITY = int(os.getenv("SERVICE_SLOT_CAPACITY", "2"))

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@motovault.sk")
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", "")

# --- Unfold admin ----------------------------------------------------------
UNFOLD = {
    "SITE_TITLE": f"{SITE_NAME} administrácia",
    "SITE_HEADER": SITE_NAME,
    "SITE_SUBHEADER": _("Predajňa a servis motocyklov"),
    "SITE_URL": FRONTEND_URL,
    "SITE_SYMBOL": "two_wheeler",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "SHOW_BACK_BUTTON": True,
    "ENVIRONMENT": "apps.core.admin_callbacks.environment_callback",
    "DASHBOARD_CALLBACK": "apps.core.admin_callbacks.dashboard_callback",
    "COLORS": {
        # Racing red accent
        "primary": {
            "50": "oklch(97.1% .013 17.38)",
            "100": "oklch(93.6% .032 17.717)",
            "200": "oklch(88.5% .062 18.334)",
            "300": "oklch(80.8% .114 19.571)",
            "400": "oklch(70.4% .191 22.216)",
            "500": "oklch(63.7% .237 25.331)",
            "600": "oklch(57.7% .245 27.325)",
            "700": "oklch(50.5% .213 27.518)",
            "800": "oklch(44.4% .177 26.899)",
            "900": "oklch(39.6% .141 25.723)",
            "950": "oklch(25.8% .092 26.042)",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": _("Prehľad"),
                "items": [
                    {"title": _("Nástenka"), "icon": "dashboard", "link": reverse_lazy("admin:index")},
                ],
            },
            {
                "title": _("Katalóg"),
                "separator": True,
                "items": [
                    {
                        "title": _("Motocykle"),
                        "icon": "two_wheeler",
                        "link": reverse_lazy("admin:catalog_motorcycle_changelist"),
                    },
                    {
                        "title": _("Značky"),
                        "icon": "sell",
                        "link": reverse_lazy("admin:catalog_brand_changelist"),
                    },
                    {
                        "title": _("Príslušenstvo & oblečenie"),
                        "icon": "sports_motorsports",
                        "link": reverse_lazy("admin:shop_accessory_changelist"),
                    },
                ],
            },
            {
                "title": _("Obchod a rezervácie"),
                "separator": True,
                "items": [
                    {
                        "title": _("Objednávky"),
                        "icon": "shopping_cart",
                        "link": reverse_lazy("admin:shop_order_changelist"),
                        "badge": "apps.core.admin_callbacks.badge_new_orders",
                    },
                    {
                        "title": _("Servisné zákazky"),
                        "icon": "build",
                        "link": reverse_lazy("admin:bookings_servicebooking_changelist"),
                        "badge": "apps.core.admin_callbacks.badge_new_service",
                    },
                    {
                        "title": _("Testovacie jazdy"),
                        "icon": "speed",
                        "link": reverse_lazy("admin:bookings_testridebooking_changelist"),
                        "badge": "apps.core.admin_callbacks.badge_new_test_rides",
                    },
                ],
            },
            {
                "title": _("Komunikácia"),
                "separator": True,
                "items": [
                    {
                        "title": _("Dopyty k vozidlám"),
                        "icon": "mark_email_unread",
                        "link": reverse_lazy("admin:inquiries_vehicleinquiry_changelist"),
                        "badge": "apps.core.admin_callbacks.badge_new_inquiries",
                    },
                    {
                        "title": _("Kontaktné správy"),
                        "icon": "mail",
                        "link": reverse_lazy("admin:inquiries_contactmessage_changelist"),
                    },
                ],
            },
            {
                "title": _("Používatelia"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {"title": _("Používatelia"), "icon": "person", "link": reverse_lazy("admin:auth_user_changelist")},
                    {"title": _("Skupiny"), "icon": "group", "link": reverse_lazy("admin:auth_group_changelist")},
                ],
            },
        ],
    },
}
