# academic/views/__init__.py
# ──────────────────────────────────────────────────────────────────────────────
# Este archivo une todos los ViewSets de la carpeta views/ en un solo paquete.
# academic/urls.py importa desde "academic.views" → encuentra este __init__.py
# El comportamiento es IDÉNTICO al anterior views.py — nada cambia afuera.
# ──────────────────────────────────────────────────────────────────────────────

from .courses import CourseViewSet
from .sessions import SessionViewSet
from .attendance import AttendanceViewSet
from .dashboard import DashboardViewSet

__all__ = [
    'CourseViewSet',
    'SessionViewSet',
    'AttendanceViewSet',
    'DashboardViewSet',
]
