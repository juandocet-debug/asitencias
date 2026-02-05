from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Course, Session, Attendance

User = get_user_model()

class SimpleStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'document_number', 'phone_number', 'photo')

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

class AttendanceCreateSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    date = serializers.DateField()
    attendances = serializers.ListField(
        child=serializers.DictField()
    )

    def create(self, validated_data):
        course_id = validated_data['course_id']
        date = validated_data['date']
        attendances_data = validated_data['attendances']

        # Get or Create Session
        course = Course.objects.get(id=course_id)
        session, created = Session.objects.get_or_create(
            course=course,
            date=date
        )

        created_attendances = []
        for item in attendances_data:
            student_id = item['student_id']
            status_val = item['status']
            
            # Update or Create Attendance
            attendance, _ = Attendance.objects.update_or_create(
                session=session,
                student_id=student_id,
                defaults={'status': status_val}
            )
            created_attendances.append(attendance)
        
        return created_attendances
