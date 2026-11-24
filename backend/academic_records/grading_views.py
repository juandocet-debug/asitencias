from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from .models import CourseEvaluation, FinalEvaluationPlan, Grade, Rubric
from .serializers import CourseEvaluationSerializer, GradeSerializer, RubricSerializer
from .views import can_manage_course, roles_for


class RubricViewSet(viewsets.ModelViewSet):
    serializer_class = RubricSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        roles = roles_for(user)
        qs = Rubric.objects.prefetch_related('criteria__levels').select_related('creator')
        if user.is_superuser or 'ADMIN' in roles:
            return qs
        if {'TEACHER', 'PRACTICE_TEACHER'} & roles:
            return qs.filter(creator=user)
        return qs.filter(course_evaluations__course__students=user, course_evaluations__active=True).distinct()

    def perform_create(self, serializer):
        if not ({'ADMIN', 'TEACHER', 'PRACTICE_TEACHER'} & roles_for(self.request.user)) and not self.request.user.is_superuser:
            raise PermissionDenied('Solo docentes o administradores pueden crear rúbricas')
        serializer.save(creator=self.request.user)

    def perform_update(self, serializer):
        self.check_editor(serializer.instance)
        serializer.save()

    @transaction.atomic
    def perform_destroy(self, instance):
        rubric = Rubric.objects.select_for_update().get(pk=instance.pk)
        self.check_editor(rubric)
        if rubric.course_evaluations.exists():
            raise ValidationError({'detail': 'La rúbrica está asignada a un curso y debe conservarse.'})
        rubric.delete()

    def check_editor(self, rubric):
        user = self.request.user
        roles = roles_for(user)
        if user.is_superuser or 'ADMIN' in roles or (
            rubric.creator_id == user.pk and {'TEACHER', 'PRACTICE_TEACHER'} & roles
        ):
            return
        raise PermissionDenied('No puedes modificar esta rúbrica.')


class CourseEvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = CourseEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        roles = roles_for(user)
        qs = CourseEvaluation.objects.select_related('rubric', 'course').prefetch_related('rubric__criteria__levels')
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if user.is_superuser or 'ADMIN' in roles:
            return qs
        if {'TEACHER', 'PRACTICE_TEACHER'} & roles:
            return qs.filter(course__teacher=user)
        return qs.filter(course__students=user, active=True)

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if not can_manage_course(self.request.user, course):
            raise PermissionDenied('No tienes permiso para asignar rúbricas en este curso')
        serializer.save()

    def perform_update(self, serializer):
        evaluation = serializer.instance
        if not can_manage_course(self.request.user, evaluation.course):
            raise PermissionDenied('No puedes modificar esta evaluación.')
        changed = any(
            serializer.validated_data.get(field, getattr(evaluation, field)) != getattr(evaluation, field)
            for field in ('course', 'rubric')
        )
        if changed:
            raise ValidationError({'detail': 'La rúbrica y el curso de una evaluación asignada son fijos.'})
        serializer.save()

    @transaction.atomic
    def perform_destroy(self, instance):
        from academic.models import Course

        course = Course.objects.select_for_update().get(pk=instance.course_id)
        if not can_manage_course(self.request.user, course):
            raise PermissionDenied('No puedes eliminar esta evaluación.')
        plan = FinalEvaluationPlan.objects.filter(course=course).first()
        if instance.grades.exists() or (plan and str(instance.rubric_id) in plan.rubric_weights):
            raise ValidationError({'detail': 'La evaluación tiene notas o forma parte de la ponderación final.'})
        instance.delete()


class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        roles = roles_for(user)
        qs = Grade.objects.select_related('evaluation__course', 'evaluation__rubric', 'student', 'evaluator').prefetch_related('evaluation__rubric__criteria__levels')
        evaluation_id = self.request.query_params.get('evaluation')
        student_id = self.request.query_params.get('student')
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(evaluation__course_id=course_id)
        if evaluation_id:
            qs = qs.filter(evaluation_id=evaluation_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        if user.is_superuser or 'ADMIN' in roles:
            return qs
        if {'TEACHER', 'PRACTICE_TEACHER'} & roles:
            return qs.filter(evaluation__course__teacher=user)
        return qs.filter(student=user)

    def perform_create(self, serializer):
        evaluation = serializer.validated_data['evaluation']
        student = serializer.validated_data['student']
        if not can_manage_course(self.request.user, evaluation.course):
            raise PermissionDenied('No tienes permiso para calificar este curso')
        if not evaluation.course.students.filter(id=student.id).exists():
            raise PermissionDenied('El estudiante no pertenece al curso')
        serializer.save(evaluator=self.request.user)

    def perform_update(self, serializer):
        grade = self.get_object()
        if not can_manage_course(self.request.user, grade.evaluation.course):
            raise PermissionDenied('No tienes permiso para editar esta nota')
        serializer.save(evaluator=self.request.user)

    @action(detail=False, methods=['post'], url_path='save-batch')
    @transaction.atomic
    def save_batch(self, request):
        evaluation_id = request.data.get('evaluation')
        student_id = request.data.get('student')
        if not evaluation_id or not student_id:
            return Response({'detail': 'Se requieren evaluation y student'}, status=400)
        evaluation = get_object_or_404(CourseEvaluation.objects.select_related('course'), pk=evaluation_id)
        if not can_manage_course(request.user, evaluation.course):
            raise PermissionDenied('No tienes permiso para calificar este curso')
        Rubric.objects.select_for_update().get(pk=evaluation.rubric_id)
        student = evaluation.course.students.filter(pk=student_id).first()
        if not student:
            return Response({'detail': 'Estudiante no pertenece al curso'}, status=400)
        grade, created = Grade.objects.update_or_create(
            evaluation=evaluation,
            student=student,
            evaluator=request.user,
            defaults={
                'scores': request.data.get('scores', {}),
                'final_grade': request.data.get('final_grade') or 0,
                'comments': request.data.get('comments', ''),
            },
        )
        return Response(GradeSerializer(grade).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
