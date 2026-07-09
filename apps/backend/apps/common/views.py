from django.conf import settings
from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """Liveness/readiness probe for load balancers and Docker."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request):
        checks: dict[str, str] = {"database": "ok", "redis": "ok"}
        status_code = 200

        try:
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as exc:
            checks["database"] = str(exc)
            status_code = 503

        try:
            from django.core.cache import cache

            cache.set("healthcheck", "1", 5)
            if cache.get("healthcheck") != "1":
                raise RuntimeError("Cache read/write failed")
        except Exception as exc:
            checks["redis"] = str(exc)
            status_code = 503

        return Response(
            {
                "status": "ok" if status_code == 200 else "degraded",
                "debug": settings.DEBUG,
                "checks": checks,
            },
            status=status_code,
        )
