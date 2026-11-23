from django.contrib import messages
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
