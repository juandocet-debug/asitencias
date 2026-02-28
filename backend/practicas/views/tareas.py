# practicas/views/tareas.py
# Contiene: TareaPracticaViewSet, EntregaTareaViewSet, EvidenciaEntregaViewSet

from rest_framework import viewsets, permissions
from rest_framework.response import Response

from practicas.models import TareaPractica, EntregaTarea, EvidenciaEntrega
from practicas.serializers import (
    TareaPracticaSerializer, EntregaTareaSerializer, EvidenciaEntregaSerializer,
)
from .practicas import get_coordinator_programs


class TareaPracticaViewSet(viewsets.ModelViewSet):
    serializer_class   = TareaPracticaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user        = self.request.user
        roles       = user.roles or [user.role]
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
        user     = self.request.user
        roles    = user.roles or [user.role]
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
        user  = self.request.user
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
