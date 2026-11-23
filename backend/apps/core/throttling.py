from rest_framework.throttling import ScopedRateThrottle


class FormSubmitThrottle(ScopedRateThrottle):
    """Rate-limits public form submissions per client IP.

    Views set ``throttle_scope = "forms"``. Only unsafe methods are throttled,
    so read-only endpoints on the same viewset are unaffected.
    """

    def allow_request(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return super().allow_request(request, view)
