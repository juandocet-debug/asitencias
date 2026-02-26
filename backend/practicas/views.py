from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import SitioPractica, ObjetivoPractica, Practica, SeguimientoPractica, AsistenciaPractica
from .serializers import (
    SitioPracticaSerializer, ObjetivoPracticaSerializer,
    PracticaSerializer, PracticaStudentsSerializer,
    SeguimientoPracticaSerializer, AsistenciaPracticaSerializer,
    UserCompactSerializer
)
from users.models import CoordinatorProfile

User = get_user_model()


# ═══════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════

def get_coordinator_programs(user):
    """IDs de programa del coordinador de PRACTICAS."""
    return list(
        CoordinatorProfile.objects.filter(user=user, coordinator_type='PRACTICAS')
        .values_list('program_id', flat=True)
    )


def has_practica_access(user):
    """True si el usuario puede acceder a prácticas (Admin, Coord PRACTICAS, ProfesorPractica)."""
    roles = user.roles or [user.role]
    if 'ADMIN' in roles or user.is_superuser:
        return True
    if 'COORDINATOR' in roles:
        return CoordinatorProfile.objects.filter(user=user, coordinator_type='PRACTICAS').exists()
    if 'PRACTICE_TEACHER' in roles:
        return True
    return False


def scoped_program_ids(user):
    """Programas visibles para el usuario según su rol. None = sin filtro (Admin)."""
    roles = user.roles or [user.role]
    if 'ADMIN' in roles or user.is_superuser:
        return None
    if 'COORDINATOR' in roles:
        return get_coordinator_programs(user)
    if 'PRACTICE_TEACHER' in roles:
        return list(
            Practica.objects.filter(profesor_practica=user)
            .values_list('program_id', flat=True).distinct()
        )
    return []


# ═══════════════════════════════════════════════════════════
# PERMISO CUSTOM
# ═══════════════════════════════════════════════════════════

class PracticasPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_practica_access(request.user)


# ═══════════════════════════════════════════════════════════
# VIEWSETS
# ═══════════════════════════════════════════════════════════

class SitioPracticaViewSet(viewsets.ModelViewSet):
    serializer_class = SitioPracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        program_ids = scoped_program_ids(self.request.user)
        qs = SitioPractica.objects.select_related('program').all()
        return qs if program_ids is None else qs.filter(program_id__in=program_ids)


class ObjetivoPracticaViewSet(viewsets.ModelViewSet):
    serializer_class = ObjetivoPracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        program_ids = scoped_program_ids(self.request.user)
        qs = ObjetivoPractica.objects.select_related('program').all()
        return qs if program_ids is None else qs.filter(program_id__in=program_ids)


class PracticaViewSet(viewsets.ModelViewSet):
    serializer_class = PracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        user = self.request.user
        roles = user.roles or [user.role]
        qs = Practica.objects.select_related(
            'program', 'coordinator', 'profesor_practica'
        ).prefetch_related('sitios', 'objetivos').all()

        if 'ADMIN' in roles or user.is_superuser:
            return qs
        if 'COORDINATOR' in roles:
            return qs.filter(program_id__in=get_coordinator_programs(user))
        if 'PRACTICE_TEACHER' in roles:
            return qs.filter(profesor_practica=user)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(coordinator=self.request.user)

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Lista de estudiantes inscritos en esta práctica."""
        practica = self.get_object()
        return Response(PracticaStudentsSerializer(practica).data)

    @action(detail=True, methods=['post'], url_path='add-student')
    def add_student(self, request, pk=None):
        """Agregar un estudiante por cédula/documento."""
        practica = self.get_object()
        doc = request.data.get('document_number', '').strip()
        if not doc:
            return Response({'error': 'Se requiere número de documento'}, status=400)
        try:
            student = User.objects.get(document_number=doc)
        except User.DoesNotExist:
            return Response({'error': f'No existe un usuario con cédula {doc}'}, status=404)
        if student in practica.students.all():
            return Response({'error': f'{student.first_name} ya está inscrito'}, status=400)
        practica.students.add(student)
        return Response({
            'message': f'{student.first_name} {student.last_name} agregado correctamente',
            'student': UserCompactSerializer(student).data
        })

    @action(detail=True, methods=['post'], url_path='remove-student')
    def remove_student(self, request, pk=None):
        """Quitar un estudiante de la práctica."""
        practica = self.get_object()
        student_id = request.data.get('student_id')
        try:
            student = practica.students.get(id=student_id)
            practica.students.remove(student)
            return Response({'message': f'{student.first_name} eliminado de la práctica'})
        except User.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado'}, status=404)


class SeguimientoPracticaViewSet(viewsets.ModelViewSet):
    serializer_class = SeguimientoPracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        user = self.request.user
        practica_id = self.request.query_params.get('practica')
        qs = SeguimientoPractica.objects.select_related(
            'practica', 'sitio', 'created_by'
        ).prefetch_related('asistencias__student').all()

        if practica_id:
            qs = qs.filter(practica_id=practica_id)

        roles = user.roles or [user.role]
        if 'ADMIN' in roles or user.is_superuser:
            return qs
        if 'COORDINATOR' in roles:
            program_ids = get_coordinator_programs(user)
            return qs.filter(practica__program_id__in=program_ids)
        if 'PRACTICE_TEACHER' in roles:
            return qs.filter(practica__profesor_practica=user)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AsistenciaPracticaViewSet(viewsets.ModelViewSet):
    serializer_class = AsistenciaPracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        seg_id = self.request.query_params.get('seguimiento')
        qs = AsistenciaPractica.objects.select_related('student', 'seguimiento').all()
        if seg_id:
            qs = qs.filter(seguimiento_id=seg_id)
        return qs


# ═══════════════════════════════════════════════════════════
# ENDPOINTS AUXILIARES
# ═══════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def docentes_del_programa(request):
    """
    Lista docentes (TEACHER o PRACTICE_TEACHER) del programa del coordinador.
    Busca por program_id del usuario (campo 'program') O por faculty si no hay coincidencias.
    ?program=<id>  ?q=<texto>
    """
    user = request.user
    roles = user.roles or [user.role]

    program_id = request.query_params.get('program')
    if not program_id:
        coord_programs = get_coordinator_programs(user)
        if not coord_programs and 'ADMIN' not in roles and not user.is_superuser:
            return Response({'error': 'No tienes programas de coordinación asignados'}, status=403)
        program_id = coord_programs[0] if coord_programs else None

    if 'ADMIN' not in roles and not user.is_superuser:
        allowed = get_coordinator_programs(user)
        if program_id and int(program_id) not in allowed:
            return Response({'error': 'No tienes acceso a ese programa'}, status=403)

    q = request.query_params.get('q', '').strip()

    # Filtro de roles: TEACHER o PRACTICE_TEACHER
    role_filter = (
        Q(role='TEACHER') | Q(role='PRACTICE_TEACHER') |
        Q(roles__contains=['TEACHER']) | Q(roles__contains=['PRACTICE_TEACHER'])
    )

    # Intentar primero por program exacto
    qs = User.objects.filter(program_id=program_id).filter(role_filter)

    # Si no hay resultados, ampliar a la facultad del programa
    if not qs.exists() and program_id:
        from users.models import Program
        try:
            prog = Program.objects.select_related('faculty').get(id=program_id)
            qs = User.objects.filter(
                faculty=prog.faculty
            ).filter(role_filter)
        except Program.DoesNotExist:
            pass

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
        'message': f'Te uniste exitosamente a {practica.name}',
        'practica': {'id': practica.id, 'name': practica.name}
    })
