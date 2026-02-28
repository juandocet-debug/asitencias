# practicas/views/__init__.py
# ──────────────────────────────────────────────────────────────────────────────
# Une todos los ViewSets y endpoints de la carpeta views/ en un solo paquete.
# practicas/urls.py importa desde "practicas.views" → encuentra este __init__.py
# El comportamiento es IDÉNTICO al anterior views.py — nada cambia afuera.
# ──────────────────────────────────────────────────────────────────────────────

# Helpers y permisos (usados externamente si es necesario)
from .practicas import (
    get_coordinator_programs,
    has_practica_access,
    scoped_program_ids,
    PracticasPermission,
)

# ViewSets — Práctica principal y catálogo
from .practicas import (
    SitioPracticaViewSet,
    ObjetivoPracticaViewSet,
    PracticaViewSet,
    docentes_del_programa,
    join_practica_by_code,
    mis_practicas,
)

# ViewSets — Diario de campo
from .diario import (
    SeguimientoPracticaViewSet,
    AsistenciaPracticaViewSet,
    ReflexionEstudianteViewSet,
    horas_acumuladas,
)

# ViewSets — Tareas
from .tareas import (
    TareaPracticaViewSet,
    EntregaTareaViewSet,
    EvidenciaEntregaViewSet,
)

__all__ = [
    # Helpers y permisos
    'get_coordinator_programs', 'has_practica_access', 'scoped_program_ids',
    'PracticasPermission',
    # Práctica
    'SitioPracticaViewSet', 'ObjetivoPracticaViewSet', 'PracticaViewSet',
    'docentes_del_programa', 'join_practica_by_code', 'mis_practicas',
    # Diario
    'SeguimientoPracticaViewSet', 'AsistenciaPracticaViewSet',
    'ReflexionEstudianteViewSet', 'horas_acumuladas',
    # Tareas
    'TareaPracticaViewSet', 'EntregaTareaViewSet', 'EvidenciaEntregaViewSet',
]
