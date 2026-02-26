"""
Views del módulo Prácticas
===========================
Permisos:
  - IsCoordinadorPracticas  → solo Coordinador de Prácticas de su propio programa
  - IsProfesorPractica      → solo usuarios con role PRACTICE_TEACHER
  - Ambos pueden leer lo de su programa
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import SitioPractica, ObjetivoPractica, Practica
from .serializers import (
    SitioPracticaSerializer, ObjetivoPracticaSerializer,
    PracticaSerializer, UserCompactSerializer
)
from users.models import CoordinatorProfile

User = get_user_model()


# ═══════════════════════════════════════════════════════════
# PERMISOS CUSTOM
# ═══════════════════════════════════════════════════════════

def get_coordinator_programs(user):
    """Devuelve los IDs de programa del coordinador de PRACTICAS."""
    profiles = CoordinatorProfile.objects.filter(
        user=user, coordinator_type='PRACTICAS'
    ).values_list('program_id', flat=True)
    return list(profiles)


class IsCoordinadorPracticasOrReadOnly(permissions.BasePermission):
    """
    Permite escritura solo a Coordinadores de PRACTICAS.
    Lectura permitida a Coordinadores de PRACTICAS y ProfesorPractica del mismo programa.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        roles = request.user.roles or [request.user.role]
        # ADMIN puede todo
        if 'ADMIN' in roles or request.user.is_superuser:
            return True
        # Coordinador de Prácticas
        if 'COORDINATOR' in roles:
            return CoordinatorProfile.objects.filter(
                user=request.user, coordinator_type='PRACTICAS'
            ).exists()
        # ProfesorPractica: solo lectura
        if 'PRACTICE_TEACHER' in roles and request.method in permissions.SAFE_METHODS:
            return True
        return False


# ═══════════════════════════════════════════════════════════
# HELPER: los programas que maneja este coordinador
# ═══════════════════════════════════════════════════════════

def scoped_program_ids(user):
    """Programas visibles para el usuario según su rol."""
    roles = user.roles or [user.role]
    if 'ADMIN' in roles or user.is_superuser:
        # Admin ve todo — devuelve None (sin filtro)
        return None
    if 'COORDINATOR' in roles:
        return get_coordinator_programs(user)
    if 'PRACTICE_TEACHER' in roles:
        # El profesor ve las prácticas donde está asignado
        return list(
            Practica.objects.filter(profesor_practica=user)
            .values_list('program_id', flat=True).distinct()
        )
    return []


# ═══════════════════════════════════════════════════════════
# VISTAS / VIEWSETS
# ═══════════════════════════════════════════════════════════

class SitioPracticaViewSet(viewsets.ModelViewSet):
    """CRUD de sitios de práctica — scoped por programa del coordinador."""
    serializer_class = SitioPracticaSerializer
    permission_classes = [IsCoordinadorPracticasOrReadOnly]

    def get_queryset(self):
        program_ids = scoped_program_ids(self.request.user)
        qs = SitioPractica.objects.select_related('program').all()
        if program_ids is None:
            return qs
        return qs.filter(program_id__in=program_ids)


class ObjetivoPracticaViewSet(viewsets.ModelViewSet):
    """CRUD de objetivos — scoped por programa del coordinador."""
    serializer_class = ObjetivoPracticaSerializer
    permission_classes = [IsCoordinadorPracticasOrReadOnly]

    def get_queryset(self):
        program_ids = scoped_program_ids(self.request.user)
        qs = ObjetivoPractica.objects.select_related('program').all()
        if program_ids is None:
            return qs
        return qs.filter(program_id__in=program_ids)


class PracticaViewSet(viewsets.ModelViewSet):
    """
    CRUD de prácticas.
    Al crear, asigna automáticamente el coordinador = request.user.
    Scoped por programa del coordinador.
    """
    serializer_class = PracticaSerializer
    permission_classes = [IsCoordinadorPracticasOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        roles = user.roles or [user.role]
        qs = Practica.objects.select_related(
            'program', 'coordinator', 'profesor_practica'
        ).prefetch_related('sitios', 'objetivos').all()

        if 'ADMIN' in roles or user.is_superuser:
            return qs
        if 'COORDINATOR' in roles:
            program_ids = get_coordinator_programs(user)
            return qs.filter(program_id__in=program_ids)
        if 'PRACTICE_TEACHER' in roles:
            return qs.filter(profesor_practica=user)
        return qs.none()

    def perform_create(self, serializer):
        """El coordinador queda automáticamente asignado."""
        serializer.save(coordinator=self.request.user)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Un estudiante se inscribe a la práctica vía código QR."""
        try:
            practica = Practica.objects.get(code=pk)
        except Practica.DoesNotExist:
            return Response({'error': 'Código inválido'}, status=status.HTTP_404_NOT_FOUND)

        if request.user in practica.students.all():
            return Response({'error': 'Ya estás inscrito en esta práctica'}, status=400)

        practica.students.add(request.user)
        return Response({'message': f'Te has unido a {practica.name}'})


# ═══════════════════════════════════════════════════════════
# ENDPOINTS DE SOPORTE
# ═══════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def docentes_del_programa(request):
    """
    Lista los docentes (TEACHER o PRACTICE_TEACHER) del programa del coordinador.
    ?program=<id>  (opcional si el coordinador tiene un solo programa)
    Búsqueda: ?q=nombre
    """
    user = request.user
    roles = user.roles or [user.role]

    # Determinar el program_id a filtrar
    program_id = request.query_params.get('program')
    if not program_id:
        # Usar el primer programa del coordinador
        coord_programs = get_coordinator_programs(user)
        if not coord_programs and 'ADMIN' not in roles and not user.is_superuser:
            return Response({'error': 'No tienes programas de coordinación asignados'}, status=403)
        program_id = coord_programs[0] if coord_programs else None

    # Validar que el coordinador tiene acceso a ese programa
    if 'ADMIN' not in roles and not user.is_superuser:
        allowed = get_coordinator_programs(user)
        if int(program_id) not in allowed:
            return Response({'error': 'No tienes acceso a ese programa'}, status=403)

    q = request.query_params.get('q', '').strip()

    qs = User.objects.filter(
        program_id=program_id,
    ).filter(
        Q(roles__contains=['TEACHER']) | Q(roles__contains=['PRACTICE_TEACHER']) |
        Q(role='TEACHER') | Q(role='PRACTICE_TEACHER')
    )

    if q:
        qs = qs.filter(
            Q(first_name__icontains=q) |
            Q(last_name__icontains=q) |
            Q(document_number__icontains=q) |
            Q(email__icontains=q)
        )

    qs = qs.order_by('first_name', 'last_name')
    return Response(UserCompactSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_practica_by_code(request):
    """Estudiante se une a una práctica usando el código."""
    code = request.data.get('code', '').strip().upper()
    if not code:
        return Response({'error': 'El código es requerido'}, status=400)

    try:
        practica = Practica.objects.get(code=code, is_active=True)
    except Practica.DoesNotExist:
        return Response({'error': 'Código inválido o práctica inactiva'}, status=404)

    if request.user in practica.students.all():
        return Response({'error': 'Ya estás inscrito en esta práctica'}, status=400)

    practica.students.add(request.user)
    return Response({
        'message': f'Te has unido exitosamente a {practica.name}',
        'practica': {'id': practica.id, 'name': practica.name, 'code': practica.code}
    })
