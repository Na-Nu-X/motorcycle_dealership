from .throttling import FormSubmitThrottle


class PublicFormMixin:
    """Mixin for public create-only endpoints: throttling + no auth needed."""

    throttle_classes = [FormSubmitThrottle]
    throttle_scope = "forms"
    authentication_classes: list = []
