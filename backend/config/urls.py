from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from users.views import CustomTokenObtainPairView

# ── Ping endpoint — mantiene vivo el servidor en Render (plan gratuito) ──────
# El frontend llama a este endpoint cada 10 minutos para evitar que Render
# duerma el servidor tras 15 minutos de inactividad.
def ping(request):
    """Responde con ok — no requiere autenticación — solo para keep-alive."""
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/academic/', include('academic.urls')),
    path('api/users/', include('users.urls')),
    path('api/practicas/', include('practicas.urls')),

    # Auth JWT — acepta cédula, email o username como identificador
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Keep-alive para Render (plan gratuito) — el frontend lo llama cada 10 min
    path('api/ping/', ping, name='ping'),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from django.urls import re_path
from django.views.generic import TemplateView

# Catch-all: sirve la app React para cualquier ruta que no sea API/admin/static
urlpatterns += [
    re_path(r'^(?!static|media|assets|api|admin).*$', TemplateView.as_view(template_name='index.html')),
]
