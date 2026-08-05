from datetime import date, datetime

from django.contrib.auth import get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response

from academic.models import Attendance, Course, Session
from academic.serializers import CourseSerializer

User = get_user_model()


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().prefetch_related('students')
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Course.objects.none()

        roles = user.roles or [user.role]
        if 'ADMIN' in roles or user.is_superuser:
            queryset = Course.objects.all()
        elif 'TEACHER' in roles or 'PRACTICE_TEACHER' in roles:
            queryset = Course.objects.filter(teacher=user)
        elif 'STUDENT' in roles:
            queryset = Course.objects.filter(students=user)
        else:
            return Course.objects.none()

        if self.action == 'list':
            archived = self.request.query_params.get('archived', 'false')
            if archived == 'true':
                queryset = queryset.filter(is_archived=True)
            elif archived != 'all':
                queryset = queryset.filter(is_archived=False)
        return queryset.prefetch_related('students')

    def perform_create(self, serializer):
        roles = self.request.user.roles or [self.request.user.role]
        if not ({'ADMIN', 'TEACHER'} & set(roles)) and not self.request.user.is_superuser:
            raise PermissionDenied("Solo docentes o administradores pueden crear clases")
        serializer.save(teacher=self.request.user)

    def perform_update(self, serializer):
        self._ensure_can_manage(self.get_object(), "editar")
        serializer.save()

    def perform_destroy(self, instance):
        self._ensure_can_manage(instance, "eliminar")
        instance.delete()

    def _ensure_can_manage(self, course, action_name="gestionar"):
        user = self.request.user
        roles = user.roles or [user.role]
        if 'ADMIN' in roles or user.is_superuser:
            return
        if ('TEACHER' in roles or 'PRACTICE_TEACHER' in roles) and course.teacher == user:
            return
        raise PermissionDenied(f"No tienes permiso para {action_name} esta clase")

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        course = self.get_object()
        self._ensure_can_manage(course, "archivar")
        course.archive()
        return Response(self.get_serializer(course).data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        course = self.get_object()
        self._ensure_can_manage(course, "restaurar")
        course.restore()
        return Response(self.get_serializer(course).data)

    @action(detail=True, methods=['get'], url_path='debug-students')
    def debug_students(self, request, pk=None):
        course = self.get_object()
        students = course.students.all()
        return Response({
            'course_id': course.id,
            'course_name': course.name,
            'total_students_count': students.count(),
            'students': [
                {'id': item.id, 'name': f'{item.first_name} {item.last_name}', 'doc': item.document_number}
                for item in students
            ],
        })

    @action(detail=True, methods=['get'])
    def attendance_stats(self, request, pk=None):
        course = self.get_object()
        sessions = Session.objects.filter(course=course)
        today_session = sessions.filter(date=date.today()).first()
        payload = {
            'total_students': course.students.count(),
            'total_sessions': sessions.count(),
            'today_present': 0,
            'today_late': 0,
            'today_absent': 0,
            'students_with_alerts': self._students_with_alerts(course),
        }
        if today_session:
            payload.update({
                'today_present': Attendance.objects.filter(session=today_session, status='PRESENT').count(),
                'today_late': Attendance.objects.filter(session=today_session, status='LATE').count(),
                'today_absent': Attendance.objects.filter(session=today_session, status='ABSENT').count(),
            })
        payload['alert_count'] = len(payload['students_with_alerts'])
        return Response(payload)

    def _students_with_alerts(self, course):
        alerts = []
        for student in course.students.all():
            absences = Attendance.objects.filter(session__course=course, student=student, status='ABSENT').count()
            lates = Attendance.objects.filter(session__course=course, student=student, status='LATE').count()
            if absences >= 3:
                alerts.append({
                    'id': student.id,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'email': student.email,
                    'phone_number': student.phone_number,
                    'photo': student.photo.url if student.photo else None,
                    'document_number': student.document_number,
                    'absences': absences,
                    'lates': lates,
                })
        return alerts

    @action(detail=True, methods=['get'])
    def attendance_history(self, request, pk=None):
        sessions = Session.objects.filter(course=self.get_object()).order_by('-date')
        return Response([self._session_summary(session) for session in sessions])

    def _session_summary(self, session):
        attendances = Attendance.objects.filter(session=session)
        present = attendances.filter(status='PRESENT').count()
        late = attendances.filter(status='LATE').count()
        absent = attendances.filter(status='ABSENT').count()
        total = present + late + absent
        return {
            'session_id': session.id,
            'date': session.date.isoformat(),
            'topic': session.topic,
            'present': present,
            'late': late,
            'absent': absent,
            'total': total,
            'attendance_rate': round((present / total * 100) if total > 0 else 0, 1),
        }

    @action(detail=True, methods=['get'])
    def student_report(self, request, pk=None):
        course = self.get_object()
        total_sessions = Session.objects.filter(course=course).count()
        report = [
            self._student_report_row(course, student, total_sessions)
            for student in course.students.all()
        ]
        report.sort(key=lambda item: item['attendance_rate'])
        return Response(report)

    def _student_report_row(self, course, student, total_sessions):
        attendances = Attendance.objects.filter(
            session__course=course,
            student=student,
        ).select_related('session').order_by('session__date')
        grouped = self._group_student_attendance(attendances)
        denom = total_sessions if total_sessions > 0 else 1
        rate = round((grouped['present'] + grouped['late'] + grouped['excused']) / denom * 100, 1)
        return {
            'id': student.id,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'email': student.email,
            'phone_number': student.phone_number,
            'photo': student.photo.url if student.photo else None,
            'document_number': student.document_number,
            'total_sessions': total_sessions,
            'attendance_rate': rate,
            'points': grouped['present'] * 10 + grouped['late'] * 2,
            'stars': student.badges.count(),
            **grouped,
        }

    def _group_student_attendance(self, attendances):
        result = {
            'present': 0, 'late': 0, 'absent': 0, 'excused': 0,
            'present_dates': [], 'late_dates': [], 'absent_dates': [],
            'excused_dates': [], 'pending_excuses': [],
        }
        for attendance in attendances:
            self._append_attendance(result, attendance)
        return result

    def _append_attendance(self, result, attendance):
        date_str = attendance.session.date.isoformat()
        if attendance.status == 'PRESENT':
            result['present'] += 1
            result['present_dates'].append(date_str)
        elif attendance.status == 'LATE':
            result['late'] += 1
            result['late_dates'].append(date_str)
        elif attendance.status == 'ABSENT':
            result['absent'] += 1
            result['absent_dates'].append(self._excuse_payload(attendance, date_str))
        elif attendance.status == 'EXCUSED':
            result['excused'] += 1
            result['excused_dates'].append(self._excuse_payload(attendance, date_str, approved=True))
        if attendance.excuse_status == 'PENDING':
            result['pending_excuses'].append(self._pending_excuse_payload(attendance, date_str))

    def _excuse_payload(self, attendance, date_str, approved=False):
        payload = {
            'date': date_str,
            'excuse_note': attendance.excuse_note,
            'excuse_file': attendance.excuse_file.url if attendance.excuse_file else None,
        }
        if not approved:
            payload.update({
                'has_excuse': bool(attendance.excuse_file or attendance.excuse_note),
                'excuse_status': attendance.excuse_status,
            })
        return payload

    def _pending_excuse_payload(self, attendance, date_str):
        return {
            'attendance_id': attendance.id,
            'date': date_str,
            'status': attendance.status,
            'excuse_note': attendance.excuse_note,
            'excuse_file': attendance.excuse_file.url if attendance.excuse_file else None,
        }

    @action(detail=True, methods=['post'])
    def update_attendance(self, request, pk=None):
        student_id = request.data.get('student_id')
        updates = request.data.get('updates', [])
        if not student_id or not updates:
            return Response({'error': 'Faltan datos'}, status=400)
        updated_count = self._apply_attendance_updates(self.get_object(), student_id, updates)
        return Response({
            'success': True,
            'updated_count': updated_count,
            'message': f'Se actualizaron {updated_count} registros',
        })

    def _apply_attendance_updates(self, course, student_id, updates):
        updated_count = 0
        for update in updates:
            date_str = update.get('date')
            new_status = update.get('status')
            if not date_str or not new_status:
                continue
            session = Session.objects.filter(
                course=course,
                date=datetime.strptime(date_str, '%Y-%m-%d').date(),
            ).first()
            if session and self._upsert_attendance(session, student_id, new_status):
                updated_count += 1
        return updated_count

    def _upsert_attendance(self, session, student_id, new_status):
        attendance, created = Attendance.objects.get_or_create(
            session=session,
            student_id=student_id,
            defaults={'status': new_status},
        )
        if created:
            return True
        if attendance.status != new_status:
            attendance.status = new_status
            attendance.save(update_fields=['status'])
            return True
        return False

    @action(detail=True, methods=['post'], url_path='add_student')
    def add_student(self, request, pk=None):
        course = self.get_object()
        self._ensure_admin("agregar usuarios a clases")
        user = self._get_user_from_request(request)
        if course.students.filter(id=user.id).exists():
            return Response({'error': f'{user.first_name} {user.last_name} ya está en esta clase'}, status=400)
        course.students.add(user)
        return Response({'message': f'{user.first_name} {user.last_name} agregado exitosamente', 'user_id': user.id})

    @action(detail=True, methods=['delete'], url_path='remove_student')
    def remove_student(self, request, pk=None):
        course = self.get_object()
        self._ensure_admin("quitar usuarios de clases")
        user = self._get_user_from_request(request)
        if not course.students.filter(id=user.id).exists():
            return Response({'error': f'{user.first_name} {user.last_name} no está en esta clase'}, status=400)
        course.students.remove(user)
        return Response({'message': f'{user.first_name} {user.last_name} quitado exitosamente', 'user_id': user.id})

    def _ensure_admin(self, action_name):
        roles = self.request.user.roles or [self.request.user.role]
        if 'ADMIN' not in roles and not self.request.user.is_superuser:
            raise PermissionDenied(f"Solo administradores pueden {action_name}")

    def _get_user_from_request(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            raise ValidationError("Se requiere user_id")
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("Usuario no encontrado")
