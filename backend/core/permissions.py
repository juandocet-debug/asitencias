# core/permissions.py
# Permisos personalizados centralizados.
# Importar desde aquí en lugar de definirlos en cada app.

from rest_framework import permissions
from users.models import CoordinatorProfile


# ── Permiso genérico de solo lectura para no-admin ────────────────────────────
# Lectura: cualquier usuario autenticado
# Escritura: solo ADMIN o superusuario
class IsAdminOrReadOnly(permissions.BasePermission):
    """Permite lectura a cualquier autenticado, escritura solo a ADMIN."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        user_roles = request.user.roles or [request.user.role]
        return request.user and ('ADMIN' in user_roles or request.user.is_superuser)


# ── Permiso para el módulo de prácticas ──────────────────────────────────────
# Solo pueden acceder: ADMIN, superusuario, COORDINATOR de prácticas, PRACTICE_TEACHER
class PracticasPermission(permissions.BasePermission):
    """Acceso al módulo de prácticas según rol."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return _has_practica_access(request.user)


# ── Helper interno (no exponer directamente) ──────────────────────────────────
def _has_practica_access(user):
    roles = user.roles or [user.role]
    if 'ADMIN' in roles or user.is_superuser:
        return True
    if 'COORDINATOR' in roles:
        return CoordinatorProfile.objects.filter(
            user=user, coordinator_type='PRACTICAS'
        ).exists()
    if 'PRACTICE_TEACHER' in roles:
        return True
    return False
