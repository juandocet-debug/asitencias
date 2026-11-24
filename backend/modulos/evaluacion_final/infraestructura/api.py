from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from academic.models import Course
from academic_records.models import CourseEvaluation, FinalEvaluationPlan, Rubric
from academic_records.views import can_manage_course, roles_for
from .repositorio import course_results


class FinalEvaluationInput(serializers.Serializer):
    attendance_weight = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal(0), max_value=Decimal(100))
    rubric_weights = serializers.DictField(
        child=serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal('0.01'), max_value=Decimal(100)),
    )

    def validate_rubric_weights(self, weights):
        if any(not key.isascii() or not key.isdecimal() or key.startswith('0')
               or len(key) > 19 or int(key) > 2**63 - 1 for key in weights):
            raise serializers.ValidationError('Identificador de rúbrica inválido.')
        return weights

    def validate(self, data):
        if data['attendance_weight'] + sum(data['rubric_weights'].values()) != 100:
            raise serializers.ValidationError('Los pesos deben sumar 100 %.')
        return data


class FinalEvaluationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_course(self, request, course_id, lock=False):
        courses = Course.objects.select_for_update() if lock else Course.objects.all()
        course = get_object_or_404(courses, pk=course_id)
        if not can_manage_course(request.user, course):
            raise PermissionDenied('No puedes gestionar la evaluación de este curso.')
        return course

    def get(self, request, course_id):
        course = self.get_course(request, course_id)
        plan = FinalEvaluationPlan.objects.filter(course=course).first()
        return Response(self.payload(course, plan))

    @transaction.atomic
    def put(self, request, course_id):
        course = self.get_course(request, course_id, lock=True)
        serializer = FinalEvaluationInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        weights = serializer.validated_data['rubric_weights']
        rubrics = Rubric.objects.select_for_update().filter(pk__in=weights).order_by('pk')
        existing = set(CourseEvaluation.objects.filter(course=course).values_list('rubric_id', flat=True))
        admin = request.user.is_superuser or 'ADMIN' in roles_for(request.user)
        allowed = [rubric for rubric in rubrics if admin or rubric.creator_id == request.user.pk or rubric.pk in existing]
        if len(allowed) != len(weights):
            raise serializers.ValidationError({'rubric_weights': 'Una rúbrica no existe o no está disponible.'})
        for rubric in allowed:
            evaluation, _ = CourseEvaluation.objects.get_or_create(course=course, rubric=rubric)
            if not evaluation.active:
                evaluation.active = True
                evaluation.save(update_fields=['active'])
        plan, _ = FinalEvaluationPlan.objects.update_or_create(course=course, defaults={
            'attendance_weight': serializer.validated_data['attendance_weight'],
            'rubric_weights': {key: str(weight) for key, weight in weights.items()},
        })
        return Response(self.payload(course, plan))

    @staticmethod
    def payload(course, plan):
        if plan is None:
            return {'attendance_weight': None, 'rubric_weights': {}, 'results': []}
        return {
            'attendance_weight': str(plan.attendance_weight),
            'rubric_weights': plan.rubric_weights,
            'results': course_results(course, plan),
        }
