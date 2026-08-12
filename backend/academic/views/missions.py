from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from academic.models import Course, Mission, MissionResource
from academic.serializers import MissionResourceSerializer, MissionSerializer
from academic.services.missions import (
    ensure_can_manage_course,
    ensure_can_view_mission,
    present_students_for_course,
    student_mission_summary,
    user_roles,
    validate_mission_payload,
)


class MissionViewSet(viewsets.ModelViewSet):
    serializer_class = MissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        roles = user_roles(user)
        queryset = Mission.objects.select_related('course', 'course__teacher').prefetch_related('resources')
        course_id = self.request.query_params.get('course') or self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if user.is_superuser or 'ADMIN' in roles:
            return queryset
        if 'TEACHER' in roles or 'PRACTICE_TEACHER' in roles:
            return queryset.filter(course__teacher=user)
        if 'STUDENT' in roles:
            return queryset.filter(course__students=user, is_active=True)
        return Mission.objects.none()

    def perform_create(self, serializer):
        course = self._get_course(serializer.validated_data.get('course'))
        ensure_can_manage_course(self.request.user, course)
        validate_mission_payload(self.request.data, self.request.FILES)
        serializer.save(course=course)

    def perform_update(self, serializer):
        mission = self.get_object()
        ensure_can_manage_course(self.request.user, mission.course)
        validate_mission_payload(self.request.data, self.request.FILES)
        serializer.save(course=mission.course)

    def perform_destroy(self, instance):
        ensure_can_manage_course(self.request.user, instance.course)
        instance.delete()

    @action(detail=True, methods=['get'], url_path='online-students')
    def online_students(self, request, pk=None):
        mission = self.get_object()
        ensure_can_view_mission(request.user, mission)
        return Response(present_students_for_course(mission.course))

    @action(detail=True, methods=['post'], url_path='resources')
    def add_resource(self, request, pk=None):
        mission = self.get_object()
        ensure_can_manage_course(request.user, mission.course)
        validate_mission_payload(request.data, request.FILES)
        serializer = MissionResourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(mission=mission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'resources/(?P<resource_id>[^/.]+)')
    def delete_resource(self, request, pk=None, resource_id=None):
        mission = self.get_object()
        ensure_can_manage_course(request.user, mission.course)
        deleted, _ = MissionResource.objects.filter(id=resource_id, mission=mission).delete()
        if not deleted:
            raise NotFound('Recurso no encontrado.')
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='student-summary')
    def student_summary(self, request):
        roles = user_roles(request.user)
        if 'STUDENT' not in roles:
            return Response({'error': 'Solo estudiantes'}, status=403)
        summary = student_mission_summary(request.user)
        mission_data = MissionSerializer(summary['mission'], context={'request': request}).data if summary['mission'] else None
        return Response({
            'mission': mission_data,
            'online': summary['online'],
            'completed': summary['completed'],
            'inventory': summary['inventory'],
        })

    def _get_course(self, course):
        if isinstance(course, Course):
            return course
        try:
            return Course.objects.get(id=course)
        except Course.DoesNotExist as error:
            raise NotFound('Clase no encontrada.') from error
