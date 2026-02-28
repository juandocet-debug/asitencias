"""
config/settings/local.py
Configuración para desarrollo local.
Uso: DJANGO_SETTINGS_MODULE=config.settings.local
"""

from .base import *  # noqa — importa toda la config base

# ── Modo debug activado en local ──────────────────────────────────────────────
DEBUG = True

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']


# ── Base de datos local — SQLite (sin configurar nada extra) ──────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# ── Archivos estáticos en local ───────────────────────────────────────────────
STATIC_URL  = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS     = [BASE_DIR.parent / 'frontend' / 'dist']
STATICFILES_STORAGE  = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ── Archivos de media en local — sistema de archivos ─────────────────────────
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
