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

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')


# ── Base de datos PostgreSQL (Render) ─────────────────────────────────────────
DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///' + str(BASE_DIR / 'db.sqlite3'),  # fallback local
        conn_max_age=0,          # no reutilizar conexiones — el servidor free tier
                                 # se reinicia desde cero y las conexiones cached
                                 # quedan obsoletas tras 2h+ de inactividad
        conn_health_checks=True, # verifica la conexión antes de usarla (Django 4.1+)
    )
}



# ── Archivos estáticos (WhiteNoise sirve el React build) ─────────────────────
STATIC_URL  = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS    = [BASE_DIR.parent / 'frontend' / 'dist']
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
