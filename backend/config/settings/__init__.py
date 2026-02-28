# config/settings/__init__.py
# En producción (Render) se usa DJANGO_SETTINGS_MODULE=config.settings.production
# Si alguien importa config.settings directamente (sin especificar módulo),
# este __init__.py importa production como valor por defecto seguro.
from .production import *  # noqa
