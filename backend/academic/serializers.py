from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Course, Session, Attendance

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
