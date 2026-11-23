import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def notify_staff(subject: str, body: str) -> None:
    """Send a best-effort e-mail to the dealership. Never breaks the request."""
    if not settings.NOTIFY_EMAIL:
        return
    try:
        send_mail(f"[{settings.SITE_NAME}] {subject}", body, settings.DEFAULT_FROM_EMAIL, [settings.NOTIFY_EMAIL])
    except Exception:  # pragma: no cover - mail transport issues must not break bookings
        logger.exception("Could not send staff notification")
