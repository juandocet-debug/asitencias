from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from users.views import CustomTokenObtainPairView

# ── Ping endpoint — keep-alive para Render (plan gratuito) ───────────────────
def ping(request):
    """Responde con ok — no requiere autenticación — solo para keep-alive."""
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/academic/', include('academic.urls')),
    path('api/users/', include('users.urls')),
    path('api/practicas/', include('practicas.urls')),

    # Auth JWT
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Keep-alive para Render
    path('api/ping/', ping, name='ping'),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# NOTA: El catch-all de React se eliminó.
# El frontend se sirve desde su propio servicio Render (asitencia-frontend.onrender.com).
# Este backend sirve SOLO la API.
