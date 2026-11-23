from django.contrib import messages
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from unfold.decorators import action


class StatusActionsMixin:
    """Helper used by the generated bulk status actions."""

    def _set_status(self, request, queryset, status, label):
        updated = queryset.update(status=status)
        self.message_user(
            request,
            _("Počet zmenených záznamov: %(count)d (nový stav: %(label)s).") % {"count": updated, "label": label},
            messages.SUCCESS,
        )


def make_status_action(status: str, label):
    """Build an Unfold bulk action that sets ``status`` on selected rows."""

    def handler(modeladmin, request, queryset):
        modeladmin._set_status(request, queryset, status, label)

    handler.__name__ = handler.__qualname__ = f"mark_{status}"
    return action(description=_("Označiť ako: %(label)s") % {"label": label})(handler)


def thumbnail_html(url: str | None):
    """Small rounded preview image for changelists."""
    if not url:
        return "—"
    return format_html(
        '<span style="display:block;width:72px;min-width:72px"><img src="{}" alt="" '
        'style="width:72px;height:45px;object-fit:cover;border-radius:4px"></span>',
        url,
    )
