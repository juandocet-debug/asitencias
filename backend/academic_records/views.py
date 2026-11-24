from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from academic.models import Course
from .models import MeetingMinute, MinuteSignature, StoredSignature
from .serializers import (
    MeetingMinuteSerializer,
    StoredSignatureSerializer,
)


def roles_for(user):
    return set(user.roles or [user.role])


def can_manage_course(user, course):
    roles = roles_for(user)
    return user.is_superuser or 'ADMIN' in roles or (course.teacher_id == user.id and bool({'TEACHER', 'PRACTICE_TEACHER'} & roles))


class MeetingMinuteViewSet(viewsets.ModelViewSet):
    serializer_class = MeetingMinuteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        roles = roles_for(user)
        qs = MeetingMinute.objects.select_related('course', 'creator').prefetch_related(
            'attendees', 'absentees', 'participants', 'signatures__user'
        )
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if user.is_superuser or 'ADMIN' in roles:
            return qs
        if {'TEACHER', 'PRACTICE_TEACHER'} & roles:
            return qs.filter(course__teacher=user)
        return qs.filter(
            status__in=['PUBLISHED', 'CLOSED']
        ).filter(
            Q(course__students=user) | Q(attendees=user) | Q(absentees=user) | Q(participants=user)
        ).distinct()

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if not can_manage_course(self.request.user, course):
            raise PermissionDenied('No tienes permiso para crear actas en este curso')
        serializer.save(creator=self.request.user)

    def perform_update(self, serializer):
        if not can_manage_course(self.request.user, self.get_object().course):
            raise PermissionDenied('No tienes permiso para editar esta acta')
        serializer.save()

    def perform_destroy(self, instance):
        if not can_manage_course(self.request.user, instance.course):
            raise PermissionDenied('No tienes permiso para eliminar esta acta')
        instance.delete()

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='sign')
    def sign(self, request, pk=None):
        minute = self.get_object()
        user = request.user
        if minute.status != 'PUBLISHED':
            return Response({'detail': 'Solo se pueden firmar actas publicadas'}, status=400)
        if not (minute.course.students.filter(id=user.id).exists() or minute.participants.filter(id=user.id).exists() or minute.attendees.filter(id=user.id).exists()):
            raise PermissionDenied('No haces parte de esta acta')
        stored_signature = StoredSignature.objects.filter(user=user).first()
        signature_data = request.data.get('signature_data') or (stored_signature.signature_data if stored_signature else '')
        if not signature_data:
            return Response({'detail': 'signature_data es requerido'}, status=400)
        signature, _ = MinuteSignature.objects.update_or_create(
            minute=minute,
            user=user,
            defaults={'signature_data': signature_data},
        )
        data = dict(minute.data or {})
        firmas = list(data.get('firmas') or [])
        full_name = user.get_full_name() or user.username
        today = signature.signed_at.date().isoformat()
        index = next((i for i, item in enumerate(firmas) if str(item.get('user_id')) == str(user.id)), None)
        payload = {
            'nombre': full_name,
            'firma': signature_data,
            'user_id': user.id,
            'firmado': True,
            'fecha': today,
        }
        if index is None:
            firmas.append(payload)
        else:
            firmas[index].update(payload)
        data['firmas'] = firmas
        minute.data = data
        minute.save(update_fields=['data', 'updated_at'])
        return Response(MeetingMinuteSerializer(minute, context={'request': request}).data)


class StoredSignatureViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        signature = StoredSignature.objects.filter(user=request.user).first()
        if not signature:
            return Response({'signature_data': None})
        return Response(StoredSignatureSerializer(signature).data)

    def create(self, request):
        serializer = StoredSignatureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        signature, _ = StoredSignature.objects.update_or_create(user=request.user, defaults=serializer.validated_data)
        return Response(StoredSignatureSerializer(signature).data, status=status.HTTP_201_CREATED)
