from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Attendance, Course, Mission, MissionResource, Session

User = get_user_model()

class SimpleStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'document_number', 'phone_number', 'photo')
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.photo:
            try:
                representation['photo'] = instance.photo.url
            except Exception:
                representation['photo'] = None
        return representation

class CourseSerializer(serializers.ModelSerializer):
    students = SimpleStudentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ('teacher',)

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'


class AttendanceItemSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(min_value=1)
    status = serializers.ChoiceField(choices=Attendance.STATUS_CHOICES)


class AttendanceCreateSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    date = serializers.DateField()
    attendances = AttendanceItemSerializer(many=True, allow_empty=False)


class AttendanceSessionQuerySerializer(serializers.Serializer):
    course_id = serializers.IntegerField(min_value=1)
    date = serializers.DateField()


class MissionResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissionResource
        fields = ('id', 'title', 'resource_type', 'url', 'file', 'order')


class MissionSerializer(serializers.ModelSerializer):
    resources = MissionResourceSerializer(many=True, read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    hero_image_url = serializers.SerializerMethodField()

    def get_image_url(self, instance):
        return media_url(instance.image)

    def get_hero_image_url(self, instance):
        return media_url(instance.hero_image)

    class Meta:
        model = Mission
        fields = (
            'id',
            'course',
            'course_name',
            'name',
            'hero_subtitle',
            'description',
            'lore_text',
            'image',
            'image_url',
            'hero_image',
            'hero_image_url',
            'group_size',
            'inventory_name',
            'inventory_description',
            'is_active',
            'created_at',
            'resources',
        )
        read_only_fields = ('created_at', 'updated_at')


def media_url(file_field):
    if not file_field:
        return None
    try:
        return file_field.url
    except Exception:
        return None
