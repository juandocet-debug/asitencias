"""
config/settings/local.py
Configuración para desarrollo local.
Uso: DJANGO_SETTINGS_MODULE=config.settings.local
"""

from .base import *  # noqa — importa toda la config base

# ── Modo debug activado en local ──────────────────────────────────────────────
DEBUG = True

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# Cookies sin HTTPS en local
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]


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
_FRONTEND_DIST = BASE_DIR.parent / 'frontend' / 'dist'
STATICFILES_DIRS = [_FRONTEND_DIST] if _FRONTEND_DIST.exists() else []
STATICFILES_STORAGE  = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ── Archivos de media en local — sistema de archivos ─────────────────────────
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# En local NO usamos Cloudinary (sin credenciales) → filesystem por defecto
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
