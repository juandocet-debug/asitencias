# practicas/views/diario.py
# Contiene: SeguimientoPracticaViewSet, AsistenciaPracticaViewSet,
#           ReflexionEstudianteViewSet y endpoint horas_acumuladas

from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from practicas.models import (
    SeguimientoPractica, AsistenciaPractica, ReflexionEstudiante, Practica,
)
from practicas.serializers import (
    SeguimientoPracticaSerializer, AsistenciaPracticaSerializer,
    ReflexionEstudianteSerializer,
)
from .practicas import PracticasPermission, get_coordinator_programs


class SeguimientoPracticaViewSet(viewsets.ModelViewSet):
    serializer_class   = SeguimientoPracticaSerializer
    permission_classes = [PracticasPermission]

    def get_queryset(self):
        user        = self.request.user
        practica_id = self.request.query_params.get('practica')
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

        if 'ADMIN' in roles or user.is_superuser:
            return qs
        if 'COORDINATOR' in roles:
            programs = get_coordinator_programs(user)
            return qs.filter(seguimiento__practica__program_id__in=programs)
        if 'PRACTICE_TEACHER' in roles:
            return qs.filter(seguimiento__practica__profesor_practica=user)

        return qs.filter(student=user)

    def perform_create(self, serializer):
        """El estudiante puede crear solo su propia reflexión."""
        user  = self.request.user
        roles = user.roles or [user.role]
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
            from rest_framework.response import Response
            return Response({'error': 'Solo puedes editar tus propias reflexiones'}, status=403)
        return super().update(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def horas_acumuladas(request, practica_id):
    """Horas acumuladas por cada estudiante en una práctica (Diario de Campo)."""
    from django.db.models import Sum
    try:
        practica = Practica.objects.get(pk=practica_id)
    except Practica.DoesNotExist:
        return Response({'error': 'Práctica no encontrada'}, status=404)

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
