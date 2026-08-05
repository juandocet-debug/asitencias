from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from academic.models import Attendance, Course, Session

User = get_user_model()


class StudentAttendanceOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id=None):
        user_roles = request.user.roles or [request.user.role]
        if 'ADMIN' not in user_roles and not request.user.is_superuser:
            raise PermissionDenied("Solo administradores pueden ver este resumen")

        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        courses = Course.objects.filter(students=student).select_related('teacher').prefetch_related('sessions')
        overview = [self._build_course_summary(course, student) for course in courses]
        overview.sort(key=lambda item: item['attendance_rate'])

        return Response({
            'student': self._serialize_student(student),
            'courses': overview,
            'total_courses': len(overview),
            'global_rate': self._global_rate(overview),
        })

    def _build_course_summary(self, course, student):
        sessions = Session.objects.filter(course=course)
        attendances = Attendance.objects.filter(
            session__course=course,
            student=student,
        ).select_related('session')
        present = attendances.filter(status='PRESENT').count()
        late = attendances.filter(status='LATE').count()
        absent = attendances.filter(status='ABSENT').count()
        excused = attendances.filter(status='EXCUSED').count()
        total = present + late + absent + excused
        return {
            'course_id': course.id,
            'course_name': course.name,
            'course_code': course.code,
            'course_color': course.color,
            'teacher_name': f'{course.teacher.first_name} {course.teacher.last_name}',
            'year': course.year,
            'period': course.period,
            'is_archived': course.is_archived,
            'total_sessions': sessions.count(),
            'present': present,
            'late': late,
            'absent': absent,
            'excused': excused,
            'attendance_rate': round(((present + late + excused) / total * 100) if total > 0 else 0, 1),
            'absent_dates': [
                item.session.date.isoformat()
                for item in attendances.filter(status='ABSENT').select_related('session')
            ],
            'in_alert': absent >= 3,
        }

    def _serialize_student(self, student):
        return {
            'id': student.id,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'document_number': student.document_number,
            'email': student.email,
            'photo': student.photo.url if student.photo else None,
            'roles': student.roles or [student.role],
        }

    def _global_rate(self, overview):
        if not overview:
            return 0
        return round(sum(item['attendance_rate'] for item in overview) / len(overview), 1)
