from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Case, When, IntegerField
from .models import (
    SitioPractica, ObjetivoPractica, Practica, SeguimientoPractica,
    AsistenciaPractica, ReflexionEstudiante, TareaPractica,
    EntregaTarea, EvidenciaEntrega
)
from .serializers import (
    SitioPracticaSerializer, ObjetivoPracticaSerializer,
    PracticaSerializer, PracticaStudentsSerializer,
    SeguimientoPracticaSerializer, AsistenciaPracticaSerializer,
    ReflexionEstudianteSerializer, EstudianteResumenSerializer,
    UserCompactSerializer, TareaPracticaSerializer,
    EntregaTareaSerializer, EvidenciaEntregaSerializer
)
from users.models import CoordinatorProfile

User = get_user_model()


# ═══════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════

def get_coordinator_programs(user):
    return list(
        CoordinatorProfile.objects.filter(user=user, coordinator_type='PRACTICAS')
        .values_list('program_id', flat=True)
    )


def has_practica_access(user):
    roles = user.roles or [user.role]
    if 'ADMIN' in roles or user.is_superuser:
        return True
    if 'COORDINATOR' in roles:
        return CoordinatorProfile.objects.filter(user=user, coordinator_type='PRACTICAS').exists()
    if 'PRACTICE_TEACHER' in roles:
        return True
    # Students enrolled in a practica also get read access via their own endpoints
    return False


def scoped_program_ids(user):
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
# PERMISOS
# ═══════════════════════════════════════════════════════════

class PracticasPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and has_practica_access(request.user))


# ═══════════════════════════════════════════════════════════
# VIEWSETS
# ═══════════════════════════════════════════════════════════

class SitioPracticaViewSet(viewsets.ModelViewSet):
    serializer_class   = SitioPracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        program_ids = scoped_program_ids(self.request.user)
        qs = SitioPractica.objects.select_related('program').all()
        return qs if program_ids is None else qs.filter(program_id__in=program_ids)


class ObjetivoPracticaViewSet(viewsets.ModelViewSet):
    serializer_class   = ObjetivoPracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        program_ids = scoped_program_ids(self.request.user)
        qs = ObjetivoPractica.objects.select_related('program').all()
        return qs if program_ids is None else qs.filter(program_id__in=program_ids)


class PracticaViewSet(viewsets.ModelViewSet):
    serializer_class   = PracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        user  = self.request.user
        roles = user.roles or [user.role]
        qs    = Practica.objects.select_related(
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
        practica = self.get_object()
        return Response(PracticaStudentsSerializer(practica).data)

    @action(detail=True, methods=['post'], url_path='add-student')
    def add_student(self, request, pk=None):
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
        practica = self.get_object()
        student_id = request.data.get('student_id')
        try:
            student = practica.students.get(id=student_id)
            practica.students.remove(student)
            return Response({'message': f'{student.first_name} eliminado de la práctica'})
        except User.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado'}, status=404)

    @action(detail=True, methods=['get'], url_path='resumen-asistencia')
    def resumen_asistencia(self, request, pk=None):
        """
        Para cada estudiante inscrito, devuelve estadísticas de asistencia:
        total sesiones, presentes, ausentes, tardanzas, excusas, % asistencia.
        """
        practica   = self.get_object()
        students   = practica.students.all()
        seguimientos = practica.seguimientos.all()
        total_sessions = seguimientos.count()

        result = []
        for student in students:
            asistencias = AsistenciaPractica.objects.filter(
                seguimiento__practica=practica, student=student
            )
            present = asistencias.filter(status='PRESENT').count()
            absent  = asistencias.filter(status='ABSENT').count()
            late    = asistencias.filter(status='LATE').count()
            excused = asistencias.filter(status='EXCUSED').count()
            pct = round((present / total_sessions * 100), 1) if total_sessions > 0 else 0.0

            photo_url = None
            if student.photo:
                try:
                    photo_url = student.photo.url
                except Exception:
                    pass

            result.append({
                'id':              student.id,
                'full_name':       f'{student.first_name} {student.last_name}'.strip(),
                'document_number': student.document_number,
                'email':           student.email,
                'photo':           photo_url,
                'total_sessions':  total_sessions,
                'present':         present,
                'absent':          absent,
                'late':            late,
                'excused':         excused,
                'attendance_pct':  pct,
            })

        return Response(result)

    @action(detail=True, methods=['get'], url_path='historial-estudiante/(?P<student_id>[0-9]+)')
    def historial_estudiante(self, request, pk=None, student_id=None):
        """
        Para un estudiante específico: devuelve cada sesión de práctica
        con su asistencia y su reflexión (si existe).
        """
        practica   = self.get_object()
        try:
            student = practica.students.get(id=student_id)
        except User.DoesNotExist:
            return Response({'error': 'El estudiante no pertenece a esta práctica'}, status=404)

        seguimientos = practica.seguimientos.order_by('-date')
        historial = []
        for seg in seguimientos:
            asistencia = AsistenciaPractica.objects.filter(seguimiento=seg, student=student).first()
            reflexion  = ReflexionEstudiante.objects.filter(seguimiento=seg, student=student).first()
            historial.append({
                'seguimiento_id': seg.id,
                'date':           seg.date,
                'topic':          seg.topic,
                'sitio':          seg.sitio.name if seg.sitio else None,
                'status':         asistencia.status if asistencia else None,
                'comment':        asistencia.comment if asistencia else '',
                'reflexion': ReflexionEstudianteSerializer(reflexion).data if reflexion else None,
            })

        return Response({
            'student': UserCompactSerializer(student).data,
            'historial': historial,
        })


class SeguimientoPracticaViewSet(viewsets.ModelViewSet):
    serializer_class   = SeguimientoPracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        user       = self.request.user
        practica_id= self.request.query_params.get('practica')
        qs = SeguimientoPractica.objects.select_related(
            'practica', 'sitio', 'created_by'
        ).prefetch_related('asistencias__student', 'reflexiones').all()

        if practica_id:
            qs = qs.filter(practica_id=practica_id)

        roles = user.roles or [user.role]
        if 'ADMIN' in roles or user.is_superuser:
            return qs
        if 'COORDINATOR' in roles:
            return qs.filter(practica__program_id__in=get_coordinator_programs(user))
        if 'PRACTICE_TEACHER' in roles:
            return qs.filter(practica__profesor_practica=user)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AsistenciaPracticaViewSet(viewsets.ModelViewSet):
    serializer_class   = AsistenciaPracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        seg_id = self.request.query_params.get('seguimiento')
        qs = AsistenciaPractica.objects.select_related('student', 'seguimiento').all()
        if seg_id:
            qs = qs.filter(seguimiento_id=seg_id)
        return qs


class ReflexionEstudianteViewSet(viewsets.ModelViewSet):
    """
    El estudiante crea y edita sus propias reflexiones.
    Coordinador y ProfesorPractica solo pueden leerlas.
    """
    serializer_class   = ReflexionEstudianteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user  = self.request.user
        roles = user.roles or [user.role]

        qs = ReflexionEstudiante.objects.select_related(
            'student', 'seguimiento__practica'
        ).all()

        seg_id = self.request.query_params.get('seguimiento')
        if seg_id:
            qs = qs.filter(seguimiento_id=seg_id)

        # Admin/Coord/ProfesorPractica ven todas las de su scope
        if 'ADMIN' in roles or user.is_superuser:
            return qs
        if 'COORDINATOR' in roles:
            programs = get_coordinator_programs(user)
            return qs.filter(seguimiento__practica__program_id__in=programs)
        if 'PRACTICE_TEACHER' in roles:
            return qs.filter(seguimiento__practica__profesor_practica=user)

        # El estudiante solo ve las suyas
        return qs.filter(student=user)

    def perform_create(self, serializer):
        """El estudiante puede crear solo su propia reflexión."""
        user = self.request.user
        roles = user.roles or [user.role]
        # Admins/coord/prof pueden crearla para cualquier estudiante
        if 'ADMIN' not in roles and not user.is_superuser and 'COORDINATOR' not in roles and 'PRACTICE_TEACHER' not in roles:
            serializer.save(student=user)
        else:
            serializer.save()

    def update(self, request, *args, **kwargs):
        """Solo el dueño o admin puede editar."""
        instance = self.get_object()
        user  = request.user
        roles = user.roles or [user.role]
        if 'ADMIN' not in roles and not user.is_superuser and instance.student != user:
            return Response({'error': 'Solo puedes editar tus propias reflexiones'}, status=403)
        return super().update(request, *args, **kwargs)


# ═══════════════════════════════════════════════════════════
# ENDPOINTS AUXILIARES
# ═══════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def docentes_del_programa(request):
    user  = request.user
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

    role_filter = (
        Q(role='TEACHER') | Q(role='PRACTICE_TEACHER') |
        Q(roles__contains=['TEACHER']) | Q(roles__contains=['PRACTICE_TEACHER'])
    )

    qs = User.objects.filter(program_id=program_id).filter(role_filter)

    # Fallback a facultad si no hay docentes con ese programa exacto
    if not qs.exists() and program_id:
        from users.models import Program
        try:
            prog = Program.objects.select_related('faculty').get(id=program_id)
            qs   = User.objects.filter(faculty=prog.faculty).filter(role_filter)
        except Program.DoesNotExist:
            pass

    if q:
        qs = qs.filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) |
            Q(document_number__icontains=q) | Q(email__icontains=q)
        )

    return Response(UserCompactSerializer(qs.order_by('first_name', 'last_name'), many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_practica_by_code(request):
    user_roles = request.user.roles or [request.user.role]
    if 'STUDENT' not in user_roles:
        return Response({'error': 'Solo los estudiantes pueden unirse a prácticas mediante código'}, status=403)
        
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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mis_practicas(request):
    """Prácticas en las que está inscrito el estudiante actual."""
    user = request.user
    practicas = Practica.objects.filter(students=user, is_active=True).select_related(
        'program', 'coordinator', 'profesor_practica'
    )
    return Response(PracticaSerializer(practicas, many=True).data)


# ═════════════════════════════════════════════════════════
# TAREAS + ENTREGAS + EVIDENCIAS
# ═════════════════════════════════════════════════════════

class TareaPracticaViewSet(viewsets.ModelViewSet):
    serializer_class   = TareaPracticaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user  = self.request.user
        roles = user.roles or [user.role]
        practica_id = self.request.query_params.get('practica')

        qs = TareaPractica.objects.select_related(
            'practica', 'created_by'
        ).prefetch_related('entregas__student', 'entregas__evidencias').all()

        if practica_id:
            qs = qs.filter(practica_id=practica_id)

        if 'ADMIN' in roles or user.is_superuser:
            return qs
        if 'COORDINATOR' in roles:
            return qs.filter(practica__program_id__in=get_coordinator_programs(user))
        if 'PRACTICE_TEACHER' in roles:
            return qs.filter(practica__profesor_practica=user)
        # Estudiante: solo ve tareas de prácticas donde está inscrito
        return qs.filter(practica__students=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class EntregaTareaViewSet(viewsets.ModelViewSet):
    serializer_class   = EntregaTareaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user  = self.request.user
        roles = user.roles or [user.role]
        tarea_id = self.request.query_params.get('tarea')

        qs = EntregaTarea.objects.select_related(
            'student', 'tarea__practica'
        ).prefetch_related('evidencias').all()

        if tarea_id:
            qs = qs.filter(tarea_id=tarea_id)

        if 'ADMIN' in roles or user.is_superuser:
            return qs
        if 'COORDINATOR' in roles:
            return qs.filter(tarea__practica__program_id__in=get_coordinator_programs(user))
        if 'PRACTICE_TEACHER' in roles:
            return qs.filter(tarea__practica__profesor_practica=user)
        return qs.filter(student=user)

    def perform_create(self, serializer):
        user = self.request.user
        roles = user.roles or [user.role]
        if 'ADMIN' not in roles and not user.is_superuser and 'COORDINATOR' not in roles and 'PRACTICE_TEACHER' not in roles:
            serializer.save(student=user)
        else:
            serializer.save()


class EvidenciaEntregaViewSet(viewsets.ModelViewSet):
    serializer_class   = EvidenciaEntregaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        entrega_id = self.request.query_params.get('entrega')
        qs = EvidenciaEntrega.objects.select_related('entrega__student').all()
        if entrega_id:
            qs = qs.filter(entrega_id=entrega_id)
        return qs


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def horas_acumuladas(request, practica_id):
    """Horas acumuladas por cada estudiante en una práctica (Diario de Campo)."""
    try:
        practica = Practica.objects.get(pk=practica_id)
    except Practica.DoesNotExist:
        return Response({'error': 'Práctica no encontrada'}, status=404)

    from django.db.models import Sum
    students = practica.students.all()
    result = []
    for student in students:
        total_horas = ReflexionEstudiante.objects.filter(
            seguimiento__practica=practica, student=student
        ).aggregate(total=Sum('horas'))['total'] or 0

        result.append({
            'id': student.id,
            'full_name': f'{student.first_name} {student.last_name}'.strip(),
            'document_number': student.document_number,
            'total_horas': float(total_horas),
        })

    return Response(result)

