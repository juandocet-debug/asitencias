from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection
from rest_framework_simplejwt.views import TokenVerifyView
from users.views import CustomTokenObtainPairView, CookieTokenRefreshView, logout_view

# ── Ping endpoint — keep-alive para Render (plan gratuito) ───────────────────
def ping(request):
    """Responde con ok — no requiere autenticación — solo para keep-alive."""
    return JsonResponse({'status': 'ok'})


def health(request):
    """Readiness: confirma que Django puede consultar su base de datos."""
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except Exception:
        return JsonResponse({'status': 'unavailable'}, status=503)
    return JsonResponse({'status': 'ok', 'database': 'available'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/academic/', include('academic.urls')),
    path('api/users/', include('users.urls')),
    path('api/practicas/', include('practicas.urls')),

    # Auth JWT
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/logout/', logout_view, name='token_logout'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Keep-alive para Render
    path('api/ping/', ping, name='ping'),
    path('api/health/', health, name='health'),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# NOTA: El catch-all de React se eliminó.
# El frontend se sirve desde su propio servicio Render (asitencia-frontend.onrender.com).
# Este backend sirve SOLO la API.
