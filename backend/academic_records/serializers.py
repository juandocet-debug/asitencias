from django.contrib.auth import get_user_model
from rest_framework import serializers

from academic.serializers import SimpleStudentSerializer
from .models import (
    CourseEvaluation,
    Grade,
    MeetingMinute,
    MinuteSignature,
    Rubric,
    RubricCriterion,
    RubricLevel,
    StoredSignature,
)

User = get_user_model()


class MinuteSignatureSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = MinuteSignature
        fields = ('id', 'user', 'user_name', 'signature_data', 'signed_at')
        read_only_fields = ('user', 'signed_at')


class MeetingMinuteSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    creator_name = serializers.CharField(source='creator.get_full_name', read_only=True)
    attendees = SimpleStudentSerializer(many=True, read_only=True)
    absentees = SimpleStudentSerializer(many=True, read_only=True)
    participants = SimpleStudentSerializer(many=True, read_only=True)
    signatures = MinuteSignatureSerializer(many=True, read_only=True)
    attendee_ids = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, write_only=True, required=False)
    absentee_ids = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, write_only=True, required=False)
    participant_ids = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, write_only=True, required=False)
    signed_by_me = serializers.SerializerMethodField()

    class Meta:
        model = MeetingMinute
        fields = (
            'id', 'course', 'course_name', 'creator', 'creator_name', 'title', 'date',
            'data', 'achievements', 'agreements', 'summary', 'attendees', 'absentees',
            'participants', 'attendee_ids', 'absentee_ids', 'participant_ids',
            'status', 'signatures', 'signed_by_me', 'created_at', 'updated_at',
        )
        read_only_fields = ('creator', 'created_at', 'updated_at')

    def get_signed_by_me(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and obj.signatures.filter(user=user).exists())

    def create(self, validated_data):
        attendees = validated_data.pop('attendee_ids', [])
        absentees = validated_data.pop('absentee_ids', [])
        participants = validated_data.pop('participant_ids', [])
        data = validated_data.get('data') or {}
        if data:
            validated_data['title'] = validated_data.get('title') or f"Acta {data.get('numero') or ''}".strip()
            validated_data['date'] = validated_data.get('date') or data.get('fecha')
            validated_data['achievements'] = validated_data.get('achievements') or data.get('desarrollo', '')
            validated_data['agreements'] = validated_data.get('agreements') or data.get('orden_dia', '')
            validated_data['summary'] = validated_data.get('summary') or data.get('proxima_convocatoria', '')
        minute = MeetingMinute.objects.create(**validated_data)
        self._set_people(minute, attendees, absentees, participants)
        return minute

    def update(self, instance, validated_data):
        attendees = validated_data.pop('attendee_ids', None)
        absentees = validated_data.pop('absentee_ids', None)
        participants = validated_data.pop('participant_ids', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        self._set_people(instance, attendees, absentees, participants)
        return instance

    def _set_people(self, minute, attendees, absentees, participants):
        if attendees is not None:
            minute.attendees.set(attendees)
        if absentees is not None:
            minute.absentees.set(absentees)
        if participants is not None:
            minute.participants.set(participants)


class StoredSignatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoredSignature
        fields = ('signature_data', 'updated_at')
        read_only_fields = ('updated_at',)


class RubricLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubricLevel
        fields = ('id', 'value', 'description')


class RubricCriterionSerializer(serializers.ModelSerializer):
    levels = RubricLevelSerializer(many=True)

    class Meta:
        model = RubricCriterion
        fields = ('id', 'name', 'order', 'levels')


class RubricSerializer(serializers.ModelSerializer):
    criteria = RubricCriterionSerializer(many=True)
    creator_name = serializers.CharField(source='creator.get_full_name', read_only=True)

    class Meta:
        model = Rubric
        fields = ('id', 'title', 'description', 'creator', 'creator_name', 'evaluator_count', 'criteria', 'created_at')
        read_only_fields = ('creator', 'created_at')

    def create(self, validated_data):
        criteria = validated_data.pop('criteria', [])
        rubric = Rubric.objects.create(**validated_data)
        self._replace_criteria(rubric, criteria)
        return rubric

    def update(self, instance, validated_data):
        criteria = validated_data.pop('criteria', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if criteria is not None:
            instance.criteria.all().delete()
            self._replace_criteria(instance, criteria)
        return instance

    def _replace_criteria(self, rubric, criteria):
        for index, item in enumerate(criteria):
            levels = item.pop('levels', [])
            criterion = RubricCriterion.objects.create(rubric=rubric, order=item.get('order', index), name=item['name'])
            for level in levels:
                RubricLevel.objects.create(criterion=criterion, **level)


class CourseEvaluationSerializer(serializers.ModelSerializer):
    rubric_detail = RubricSerializer(source='rubric', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = CourseEvaluation
        fields = ('id', 'rubric', 'rubric_detail', 'course', 'course_name', 'date', 'active')
        read_only_fields = ('date',)


class GradeSerializer(serializers.ModelSerializer):
    student_detail = SimpleStudentSerializer(source='student', read_only=True)
    evaluator_name = serializers.CharField(source='evaluator.get_full_name', read_only=True)
    evaluation_detail = CourseEvaluationSerializer(source='evaluation', read_only=True)

    class Meta:
        model = Grade
        fields = (
            'id', 'evaluation', 'evaluation_detail', 'student', 'student_detail',
            'evaluator', 'evaluator_name', 'scores', 'final_grade', 'comments',
            'created_at', 'updated_at',
        )
        read_only_fields = ('evaluator', 'created_at', 'updated_at')
