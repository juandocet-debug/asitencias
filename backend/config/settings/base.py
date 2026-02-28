"""
config/settings/base.py
Configuración común a todos los entornos (desarrollo y producción).
No usar directamente — importar desde local.py o production.py.
"""

import os
from pathlib import Path
from datetime import timedelta

# BASE_DIR apunta a la carpeta backend/ (3 niveles arriba de este archivo)
# settings/base.py → settings/ → config/ → backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent


# ── Clave secreta ─────────────────────────────────────────────────────────────
# Obligatoria y debe venir de variable de entorno. Si no existe → el servidor
# no arranca (mejor fallar que correr inseguro en producción).
SECRET_KEY = os.environ['SECRET_KEY']


# ── Apps instaladas ───────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'cloudinary_storage',
    'django.contrib.staticfiles',
    'cloudinary',

    # Terceros
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # Apps locales
    'core',         # permisos y utilidades compartidas entre apps
    'users',
    'academic',
    'gamification',
    'practicas',
]

# ── Middlewares ───────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',   # sirve archivos estáticos en Render
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# ── Validación de contraseñas ─────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ── Internacionalización ──────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True


# ── Modelo de usuario personalizado ──────────────────────────────────────────
AUTH_USER_MODEL = 'users.User'

# ── Backends de autenticación ─────────────────────────────────────────────────
AUTHENTICATION_BACKENDS = [
    'users.backends.DocumentNumberBackend',         # login con cédula
    'django.contrib.auth.backends.ModelBackend',    # login con username/email
]


# ── CORS ──────────────────────────────────────────────────────────────────────
# TODO: restringir a dominios específicos cuando se confirmen todos los orígenes
CORS_ALLOW_ALL_ORIGINS = True


# ── Django REST Framework ─────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Sin paginación global — los cursos devuelven TODOS los estudiantes
    'DEFAULT_PAGINATION_CLASS': None,
    'PAGE_SIZE': None,
    # Rate limiting — máximo 10 intentos de login por minuto por IP
    'DEFAULT_THROTTLE_RATES': {
        'login': '10/min',
    },
}

# ── JWT ───────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}


# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND       = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST          = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT          = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS       = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER     = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL  = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@upn.edu.co')

# URL del frontend (para los links en emails de recuperación de contraseña)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')


# ── Integración ILINYX ↔ AGON ────────────────────────────────────────────────
# Clave compartida server-to-server. Configurar en Render como variable de entorno.
ILINYX_API_KEY = os.environ.get('ILINYX_API_KEY', '')


# ── Headers de seguridad HTTP ─────────────────────────────────────────────────
X_FRAME_OPTIONS             = 'DENY'     # evita clickjacking vía iframes
SECURE_CONTENT_TYPE_NOSNIFF = True       # impide que el navegador adivine el tipo MIME
SECURE_BROWSER_XSS_FILTER   = True       # activa el filtro XSS del navegador
SECURE_HSTS_SECONDS         = 31536000   # fuerza HTTPS durante 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True    # aplica también a subdominios
