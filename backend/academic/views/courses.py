from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from datetime import date

from academic.models import Course, Session, Attendance
from academic.serializers import CourseSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().prefetch_related('students')
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Course.objects.none()
        user_roles = user.roles or [user.role]

        if 'ADMIN' in user_roles or user.is_superuser:
            return Course.objects.all().prefetch_related('students')
        elif 'TEACHER' in user_roles or 'PRACTICE_TEACHER' in user_roles:
            return Course.objects.filter(teacher=user).prefetch_related('students')
        elif 'STUDENT' in user_roles:
            return Course.objects.filter(students=user).prefetch_related('students')
        return Course.objects.none()

    def perform_create(self, serializer):
        user_roles = self.request.user.roles or [self.request.user.role]
        # PRACTICE_TEACHER NO puede crear clases — solo ADMIN y TEACHER regular
        allowed = {'ADMIN', 'TEACHER'}
        if not (allowed & set(user_roles)) and not self.request.user.is_superuser:
            raise PermissionDenied("Solo docentes o administradores pueden crear clases")
        serializer.save(teacher=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        user_roles = self.request.user.roles or [self.request.user.role]
        if 'ADMIN' in user_roles or self.request.user.is_superuser:
            serializer.save()
        elif ('TEACHER' in user_roles or 'PRACTICE_TEACHER' in user_roles) and instance.teacher == self.request.user:
            serializer.save()
        else:
            raise PermissionDenied("No tienes permiso para editar esta clase")

    def perform_destroy(self, instance):
        user_roles = self.request.user.roles or [self.request.user.role]
        if 'ADMIN' in user_roles or self.request.user.is_superuser:
            instance.delete()
        elif ('TEACHER' in user_roles or 'PRACTICE_TEACHER' in user_roles) and instance.teacher == self.request.user:
            instance.delete()
        else:
            raise PermissionDenied("No tienes permiso para eliminar esta clase")

    @action(detail=True, methods=['get'], url_path='debug-students')
    def debug_students(self, request, pk=None):
        """Debug: ver cuántos estudiantes tiene un curso"""
        course = self.get_object()
        students = course.students.all()
        return Response({
            'course_id': course.id,
            'course_name': course.name,
            'total_students_count': students.count(),
            'students': [
                {'id': s.id, 'name': f'{s.first_name} {s.last_name}', 'doc': s.document_number}
                for s in students
            ]
        })

    @action(detail=True, methods=['get'])
    def attendance_stats(self, request, pk=None):
        """Obtener estadísticas de asistencia de un curso"""
        course = self.get_object()
        today = date.today()

        total_students = course.students.count()
        sessions = Session.objects.filter(course=course)
        total_sessions = sessions.count()

        today_session = sessions.filter(date=today).first()
        today_present = 0
        today_late = 0
        today_absent = 0

        if today_session:
            today_present = Attendance.objects.filter(session=today_session, status='PRESENT').count()
            today_late = Attendance.objects.filter(session=today_session, status='LATE').count()
            today_absent = Attendance.objects.filter(session=today_session, status='ABSENT').count()

        students_with_alerts = []
        for student in course.students.all():
            absences = Attendance.objects.filter(
                session__course=course, student=student, status='ABSENT'
            ).count()
            lates = Attendance.objects.filter(
                session__course=course, student=student, status='LATE'
            ).count()

            if absences >= 3:
                students_with_alerts.append({
                    'id': student.id,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'email': student.email,
                    'phone_number': student.phone_number,
                    'photo': student.photo.url if student.photo else None,
                    'document_number': student.document_number,
                    'absences': absences,
                    'lates': lates
                })

        return Response({
            'total_students': total_students,
            'total_sessions': total_sessions,
            'today_present': today_present,
            'today_late': today_late,
            'today_absent': today_absent,
            'students_with_alerts': students_with_alerts,
            'alert_count': len(students_with_alerts)
        })

    @action(detail=True, methods=['get'])
    def attendance_history(self, request, pk=None):
        """Obtener historial de asistencias por sesión"""
        course = self.get_object()
        sessions = Session.objects.filter(course=course).order_by('-date')

        history = []
        for session in sessions:
            attendances = Attendance.objects.filter(session=session)
            present = attendances.filter(status='PRESENT').count()
            late = attendances.filter(status='LATE').count()
            absent = attendances.filter(status='ABSENT').count()
            total = present + late + absent

            history.append({
                'session_id': session.id,
                'date': session.date.isoformat(),
                'topic': session.topic,
                'present': present,
                'late': late,
                'absent': absent,
                'total': total,
                'attendance_rate': round((present / total * 100) if total > 0 else 0, 1)
            })

        return Response(history)

    @action(detail=True, methods=['get'])
    def student_report(self, request, pk=None):
        """Obtener reporte de asistencia por estudiante con fechas detalladas"""
        course = self.get_object()

        report = []
        for student in course.students.all():
            attendances = Attendance.objects.filter(
                session__course=course, student=student
            ).select_related('session').order_by('session__date')

            present_count = late_count = absent_count = excused_count = 0
            present_dates = []
            late_dates = []
            absent_dates = []
            excused_dates = []
            pending_excuses = []

            for att in attendances:
                date_str = att.session.date.isoformat()
                if att.status == 'PRESENT':
                    present_count += 1
                    present_dates.append(date_str)
                elif att.status == 'LATE':
                    late_count += 1
                    late_dates.append(date_str)
                elif att.status == 'ABSENT':
                    absent_count += 1
                    absent_dates.append({
                        'date': date_str,
                        'has_excuse': bool(att.excuse_file or att.excuse_note),
                        'excuse_status': att.excuse_status,
                        'excuse_note': att.excuse_note,
                        'excuse_file': att.excuse_file.url if att.excuse_file else None
                    })
                elif att.status == 'EXCUSED':
                    excused_count += 1
                    excused_dates.append({
                        'date': date_str,
                        'excuse_note': att.excuse_note,
                        'excuse_file': att.excuse_file.url if att.excuse_file else None
                    })

                if att.excuse_status == 'PENDING':
                    pending_excuses.append({
                        'attendance_id': att.id,
                        'date': date_str,
                        'status': att.status,
                        'excuse_note': att.excuse_note,
                        'excuse_file': att.excuse_file.url if att.excuse_file else None
                    })

            total = present_count + late_count + absent_count + excused_count

            report.append({
                'id': student.id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'email': student.email,
                'phone_number': student.phone_number,
                'photo': student.photo.url if student.photo else None,
                'document_number': student.document_number,
                'present': present_count,
                'late': late_count,
                'absent': absent_count,
                'excused': excused_count,
                'total_sessions': total,
                'attendance_rate': round(((present_count + late_count + excused_count) / total * 100) if total > 0 else 0, 1),
                'present_dates': present_dates,
                'late_dates': late_dates,
                'absent_dates': absent_dates,
                'excused_dates': excused_dates,
                'pending_excuses': pending_excuses
            })

        report.sort(key=lambda x: x['attendance_rate'])
        return Response(report)

    @action(detail=True, methods=['post'])
    def update_attendance(self, request, pk=None):
        """Actualizar asistencia de un estudiante (para excusas válidas)"""
        from datetime import datetime
        course = self.get_object()
        student_id = request.data.get('student_id')
        updates = request.data.get('updates', [])

        if not student_id or not updates:
            return Response({'error': 'Faltan datos'}, status=400)

        updated_count = 0
        for update in updates:
            date_str = update.get('date')
            new_status = update.get('status')
            if not date_str or not new_status:
                continue
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                session = Session.objects.filter(course=course, date=date_obj).first()
                if not session:
                    continue
                attendance, created = Attendance.objects.get_or_create(
                    session=session,
                    student_id=student_id,
                    defaults={'status': new_status}
                )
                if not created and attendance.status != new_status:
                    attendance.status = new_status
                    attendance.save()
                    updated_count += 1
                elif created:
                    updated_count += 1
            except Exception as e:
                print(f"Error updating attendance: {e}")
                continue

        return Response({
            'success': True,
            'updated_count': updated_count,
            'message': f'Se actualizaron {updated_count} registros'
        })
