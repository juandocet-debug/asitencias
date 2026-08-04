"""
config/settings/production.py
Configuración para producción en Render.
Uso: DJANGO_SETTINGS_MODULE=config.settings.production
"""

import os
import dj_database_url
import cloudinary
import cloudinary.uploader
import cloudinary.api

from .base import *  # noqa — importa toda la config base


# ── Seguridad ─────────────────────────────────────────────────────────────────
DEBUG = False

def _csv_environment(name):
    return [
        value.strip()
        for value in os.environ.get(name, '').split(',')
        if value.strip()
    ]


ALLOWED_HOSTS = _csv_environment('ALLOWED_HOSTS')
railway_domain = os.environ.get('RAILWAY_PUBLIC_DOMAIN', '').strip()
if railway_domain and railway_domain not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(railway_domain)

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = _csv_environment('CORS_ALLOWED_ORIGINS')
CSRF_TRUSTED_ORIGINS = _csv_environment('CSRF_TRUSTED_ORIGINS')

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


# ── Base de datos PostgreSQL (Render) ─────────────────────────────────────────
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ['DATABASE_URL'],
        conn_max_age=0,          # no reutilizar conexiones — el servidor free tier
                                 # se reinicia desde cero y las conexiones cached
                                 # quedan obsoletas tras 2h+ de inactividad
        conn_health_checks=True, # verifica la conexión antes de usarla (Django 4.1+)
    )
}



# ── Archivos estáticos (WhiteNoise sirve solo los estáticos de Django) ───────
STATIC_URL  = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
# STATICFILES_DIRS vacío — el frontend se despliega en su propio servicio Render
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ── Cloudinary — media de usuarios (fotos de perfil, etc.) ───────────────────
cloudinary.config(
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.environ.get('CLOUDINARY_API_KEY'),
    api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
    secure     = True,
)

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY':    os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

# En producción todos los archivos de media van a Cloudinary (no al disco)
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
