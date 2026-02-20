from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from datetime import date
from .models import Course, Session, Attendance
from .serializers import CourseSerializer, SessionSerializer, AttendanceSerializer, AttendanceCreateSerializer

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().prefetch_related('students')
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Course.objects.none()
            
        if user.role == 'ADMIN' or user.is_superuser:
            return Course.objects.all().prefetch_related('students')
        elif user.role == 'TEACHER':
            return Course.objects.filter(teacher=user).prefetch_related('students')
        elif user.role == 'STUDENT':
            return Course.objects.filter(students=user).prefetch_related('students')
        return Course.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role not in ['ADMIN', 'TEACHER']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Solo docentes o administradores pueden crear clases")
        serializer.save(teacher=self.request.user)
    
    def perform_update(self, serializer):
        instance = self.get_object()
        if self.request.user.role == 'ADMIN' or self.request.user.is_superuser:
            serializer.save()
        elif self.request.user.role == 'TEACHER' and instance.teacher == self.request.user:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permiso para editar esta clase")
    
    def perform_destroy(self, instance):
        if self.request.user.role == 'ADMIN' or self.request.user.is_superuser:
            instance.delete()
        elif self.request.user.role == 'TEACHER' and instance.teacher == self.request.user:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
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
        
        # Total de estudiantes
        total_students = course.students.count()
        
        # Sesiones
        sessions = Session.objects.filter(course=course)
        total_sessions = sessions.count()
        
        # Asistencia de hoy
        today_session = sessions.filter(date=today).first()
        today_present = 0
        today_late = 0
        today_absent = 0
        
        if today_session:
            today_present = Attendance.objects.filter(session=today_session, status='PRESENT').count()
            today_late = Attendance.objects.filter(session=today_session, status='LATE').count()
            today_absent = Attendance.objects.filter(session=today_session, status='ABSENT').count()
        
        # Estudiantes con más de 3 fallas
        students_with_alerts = []
        for student in course.students.all():
            absences = Attendance.objects.filter(
                session__course=course, 
                student=student, 
                status='ABSENT'
            ).count()
            lates = Attendance.objects.filter(
                session__course=course, 
                student=student, 
                status='LATE'
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
                session__course=course, 
                student=student
            ).select_related('session').order_by('session__date')
            
            present_count = 0
            late_count = 0
            absent_count = 0
            excused_count = 0
            
            present_dates = []
            late_dates = []
            absent_dates = []
            excused_dates = []
            
            # Para excusas pendientes
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
                
                # Recolectar excusas pendientes
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
                'absent_dates': absent_dates,  # Ahora incluye info de excusas
                'excused_dates': excused_dates,
                'pending_excuses': pending_excuses
            })
        
        # Ordenar por tasa de asistencia (menor primero = más problemáticos)
        report.sort(key=lambda x: x['attendance_rate'])
        
        return Response(report)


    @action(detail=True, methods=['post'])
    def update_attendance(self, request, pk=None):
        """Actualizar asistencia de un estudiante (para excusas válidas)"""
        course = self.get_object()
        student_id = request.data.get('student_id')
        updates = request.data.get('updates', [])
        
        if not student_id or not updates:
            return Response({'error': 'Faltan datos'}, status=400)
        
        from datetime import datetime
        
        updated_count = 0
        for update in updates:
            date_str = update.get('date')
            new_status = update.get('status')
            
            if not date_str or not new_status:
                continue
            
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                
                # Buscar la sesión de esa fecha
                session = Session.objects.filter(course=course, date=date_obj).first()
                if not session:
                    continue
                
                # Buscar o crear el registro de asistencia
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


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        serializer = AttendanceCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def submit_excuse(self, request):
        """Estudiante sube una excusa para una falta"""
        from django.utils import timezone
        
        attendance_id = request.data.get('attendance_id')
        excuse_note = request.data.get('excuse_note', '')
        excuse_file = request.FILES.get('excuse_file')
        
        if not attendance_id:
            return Response({'error': 'Falta el ID de asistencia'}, status=400)
            
        try:
            attendance = Attendance.objects.get(id=attendance_id)
            
            # Verificar que el estudiante es el dueño del registro
            if attendance.student != request.user:
                return Response({'error': 'No autorizado'}, status=403)
            
            # Verificar que sea una falta
            if attendance.status not in ['ABSENT', 'LATE']:
                return Response({'error': 'Solo puedes subir excusas para faltas o retardos'}, status=400)
            
            # Guardar la excusa
            attendance.excuse_note = excuse_note
            attendance.excuse_status = 'PENDING'
            attendance.excuse_submitted_at = timezone.now()
            
            if excuse_file:
                attendance.excuse_file = excuse_file
            
            attendance.save()
            
            return Response({
                'success': True,
                'message': 'Excusa enviada correctamente. Espera la revisión del profesor.'
            })
            
        except Attendance.DoesNotExist:
            return Response({'error': 'Registro no encontrado'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def review_excuse(self, request):
        """Profesor revisa una excusa (aprobar/rechazar)"""
        from django.utils import timezone
        
        attendance_id = request.data.get('attendance_id')
        decision = request.data.get('decision')  # 'APPROVED' o 'REJECTED'
        
        if not attendance_id or decision not in ['APPROVED', 'REJECTED']:
            return Response({'error': 'Datos inválidos'}, status=400)
        
        try:
            attendance = Attendance.objects.get(id=attendance_id)
            
            # Verificar que el usuario es profesor del curso
            if attendance.session.course.teacher != request.user:
                return Response({'error': 'No autorizado'}, status=403)
            
            attendance.excuse_status = decision
            attendance.excuse_reviewed_at = timezone.now()
            
            # Si se aprueba, cambiar estado a EXCUSED
            if decision == 'APPROVED':
                attendance.status = 'EXCUSED'
            
            attendance.save()
            
            return Response({
                'success': True,
                'message': f'Excusa {"aprobada" if decision == "APPROVED" else "rechazada"}'
            })
            
        except Attendance.DoesNotExist:
            return Response({'error': 'Registro no encontrado'}, status=404)

    @action(detail=False, methods=['get'])
    def pending_excuses(self, request):
        """Obtener excusas pendientes de revisión para un profesor"""
        course_id = request.query_params.get('course_id')
        
        if not course_id:
            return Response({'error': 'Falta course_id'}, status=400)
        
        try:
            from .models import Course
            course = Course.objects.get(id=course_id, teacher=request.user)
            
            pending = Attendance.objects.filter(
                session__course=course,
                excuse_status='PENDING'
            ).select_related('student', 'session')
            
            result = []
            for att in pending:
                result.append({
                    'id': att.id,
                    'student_id': att.student.id,
                    'student_name': f"{att.student.first_name} {att.student.last_name}",
                    'student_photo': att.student.photo.url if att.student.photo else None,
                    'student_document': att.student.document_number,
                    'date': att.session.date.isoformat(),
                    'original_status': 'Falta' if att.status == 'ABSENT' else 'Retardo',
                    'excuse_note': att.excuse_note,
                    'excuse_file': att.excuse_file.url if att.excuse_file else None,
                    'submitted_at': att.excuse_submitted_at.isoformat() if att.excuse_submitted_at else None
                })
            
            return Response(result)
            
        except Course.DoesNotExist:
            return Response({'error': 'Curso no encontrado'}, status=404)

    @action(detail=False, methods=['get'])
    def teacher_all_pending_excuses(self, request):
        """Obtener TODAS las excusas pendientes de revisión para todas las clases del profesor"""
        pending = Attendance.objects.filter(
            session__course__teacher=request.user,
            excuse_status='PENDING'
        ).select_related('student', 'session', 'session__course')
        
        result = []
        for att in pending:
            result.append({
                'id': att.id,
                'course_id': att.session.course.id,
                'course_name': att.session.course.name,
                'student_id': att.student.id,
                'student_name': f"{att.student.first_name} {att.student.last_name}",
                'student_photo': att.student.photo.url if att.student.photo else None,
                'student_document': att.student.document_number,
                'date': att.session.date.isoformat(),
                'status': att.status,
                'status_label': 'Falta' if att.status == 'ABSENT' else 'Retardo',
                'excuse_note': att.excuse_note,
                'excuse_file': att.excuse_file.url if att.excuse_file else None,
                'submitted_at': att.excuse_submitted_at.isoformat() if att.excuse_submitted_at else None
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def my_absences(self, request):
        """Obtener las faltas/retardos de un estudiante para que pueda subir excusas"""
        course_id = request.query_params.get('course_id')
        
        if not course_id:
            return Response({'error': 'Falta course_id'}, status=400)
        
        absences = Attendance.objects.filter(
            session__course_id=course_id,
            student=request.user,
            status__in=['ABSENT', 'LATE']
        ).select_related('session')
        
        result = []
        for att in absences:
            result.append({
                'id': att.id,
                'date': att.session.date.isoformat(),
                'status': att.status,
                'status_label': 'Falta' if att.status == 'ABSENT' else 'Retardo',
                'has_excuse': bool(att.excuse_file or att.excuse_note),
                'excuse_status': att.excuse_status,
                'excuse_status_label': {
                    'PENDING': 'En revisión',
                    'APPROVED': 'Aprobada',
                    'REJECTED': 'Rechazada'
                }.get(att.excuse_status, None),
                'excuse_note': att.excuse_note,
                'excuse_file': att.excuse_file.url if att.excuse_file else None
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def all_my_absences(self, request):
        """Obtener todas las faltas/retardos de un estudiante en todos sus cursos"""
        absences = Attendance.objects.filter(
            student=request.user,
            status__in=['ABSENT', 'LATE']
        ).select_related('session', 'session__course')
        
        result = []
        for att in absences:
            result.append({
                'id': att.id,
                'course_id': att.session.course.id,
                'course_name': att.session.course.name,
                'date': att.session.date.isoformat(),
                'status': att.status,
                'status_label': 'Falta' if att.status == 'ABSENT' else 'Retardo',
                'has_excuse': bool(att.excuse_file or att.excuse_note),
                'excuse_status': att.excuse_status,
                'excuse_status_label': {
                    'PENDING': 'En revisión',
                    'APPROVED': 'Aprobada',
                    'REJECTED': 'Rechazada'
                }.get(att.excuse_status, None),
                'excuse_note': att.excuse_note,
                'excuse_file': att.excuse_file.url if att.excuse_file else None
            })
        
        return Response(result)

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        user = request.user
        today = date.today()
        # 0=Monday, 6=Sunday. Map to our storage format.
        today_code = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][today.weekday()]
        
        # Filtros opcionales
        year = request.query_params.get('year')
        period = request.query_params.get('period') # e.g., '1' or '2'

        if user.role == 'STUDENT':
            # --- ESTADÍSTICAS ESTUDIANTE ---
            
            # Cursos inscritos
            courses = Course.objects.filter(students=user)
            if year:
                courses = courses.filter(year=year)
            if period:
                courses = courses.filter(period=period)
                
            total_courses = courses.count()
            
            # Calcular asistencia global
            total_sessions = 0
            total_present = 0
            total_absent = 0
            total_late = 0
            
            today_classes = []
            alerts = []
            
            for course in courses:
                # Asistencias en este curso
                attendances = Attendance.objects.filter(session__course=course, student=user)
                course_sessions = Session.objects.filter(course=course).count()
                
                presences = attendances.filter(status='PRESENT').count()
                lates = attendances.filter(status='LATE').count()
                absences = attendances.filter(status='ABSENT').count()
                excused = attendances.filter(status='EXCUSED').count()
                
                total_sessions += course_sessions
                total_present += presences
                total_late += lates
                total_absent += absences
                
                # Alerta si tiene muchas faltas (ej. >= 3)
                if absences >= 3:
                     alerts.append({
                        'course_name': course.name,
                        'absences': absences,
                        'limit': 3 # Configurable
                     })
                
                # Revisar si hay clase hoy según el horario
                has_class_today = False
                class_time = "Sin horario"
                
                if course.schedule:
                    for slot in course.schedule:
                        if slot.get('day') == today_code:
                            has_class_today = True
                            class_time = f"{slot.get('start')} - {slot.get('end')}"
                            break
                
                if has_class_today:
                    today_classes.append({
                        'id': course.id,
                        'name': course.name,
                        'code': course.code,
                        'schedule': class_time,
                        'teacher': f"{course.teacher.first_name} {course.teacher.last_name}",
                        'all_schedules': course.schedule # Para referencia completa
                    })

            global_rate = 0
            # Simplificación: Usar la suma de registros de asistencia existentes
            total_recorded = total_present + total_late + total_absent + excused
            if total_recorded > 0:
                global_rate = round(((total_present + total_late + excused) / total_recorded) * 100, 1)

            return Response({
                'role': 'STUDENT',
                'stats': {
                    'total_courses': total_courses,
                    'attendance_rate': global_rate,
                    'total_absences': total_absent,
                    'total_lates': total_late,
                    'alerts': alerts
                },
                'today_classes': today_classes
            })

        elif user.role == 'ADMIN':
            # --- ESTADÍSTICAS ADMINISTRADOR ---
            courses = Course.objects.all()
            if year:
                courses = courses.filter(year=year)
            if period:
                courses = courses.filter(period=period)
                
            total_students = User.objects.filter(role='STUDENT').count()
            total_teachers = User.objects.filter(role='TEACHER').count()
            
            # Clases de hoy
            today_classes = []
            for c in courses:
                has_class_today = False
                class_time = "Sin horario"
                if c.schedule:
                    for slot in c.schedule:
                        if slot.get('day') == today_code:
                            has_class_today = True
                            class_time = f"{slot.get('start')} - {slot.get('end')}"
                            break
                if has_class_today:
                    today_classes.append({
                        'id': c.id,
                        'name': c.name,
                        'code': c.code,
                        'schedule': class_time,
                        'teacher': f"{c.teacher.first_name} {c.teacher.last_name}",
                        'all_schedules': c.schedule
                    })

            # Asistencia promedio global hoy
            today_sessions = Session.objects.filter(date=today)
            today_attendance_rate = 0
            if today_sessions.exists():
                total_att = Attendance.objects.filter(session__in=today_sessions).count()
                present_att = Attendance.objects.filter(session__in=today_sessions, status='PRESENT').count()
                if total_att > 0:
                    today_attendance_rate = round((present_att / total_att) * 100, 1)

            return Response({
                'role': 'ADMIN',
                'stats': {
                    'total_courses': courses.count(),
                    'total_students': total_students,
                    'total_teachers': total_teachers,
                    'today_sessions': len(today_classes),
                    'today_attendance_rate': today_attendance_rate
                },
                'today_classes': today_classes
            })

        elif user.role == 'TEACHER':
            # --- ESTADÍSTICAS PROFESOR ---
            my_courses = Course.objects.filter(teacher=user)
            if year:
                my_courses = my_courses.filter(year=year)
            if period:
                my_courses = my_courses.filter(period=period)
                
            total_students = 0
            today_classes = []
            
            for c in my_courses:
                total_students += c.students.count()
                
                # Revisar horario para hoy
                has_class_today = False
                class_time = "Sin horario"
                if c.schedule:
                    for slot in c.schedule:
                        if slot.get('day') == today_code:
                            has_class_today = True
                            class_time = f"{slot.get('start')} - {slot.get('end')}"
                            break
                            
                if has_class_today:
                    today_classes.append({
                        'id': c.id,
                        'name': c.name,
                        'code': c.code,
                        'schedule': class_time,
                        'students_count': c.students.count(),
                        'all_schedules': c.schedule
                    })
            
            # Asistencia promedio de mis cursos hoy
            today_sessions = Session.objects.filter(course__in=my_courses, date=today)
            today_attendance_rate = 0
            
            if today_sessions.exists():
                total_att = Attendance.objects.filter(session__in=today_sessions).count()
                present_att = Attendance.objects.filter(session__in=today_sessions, status='PRESENT').count()
                if total_att > 0:
                    today_attendance_rate = round((present_att / total_att) * 100, 1)

            return Response({
                'role': 'TEACHER',
                'stats': {
                    'total_courses': my_courses.count(),
                    'total_students': total_students,
                    'today_sessions': len(today_classes), # Clases programadas hoy segun horario
                    'today_attendance_rate': today_attendance_rate
                },
                'today_classes': today_classes
            })
        
        return Response({'error': 'Rol no reconocido o no autorizado'}, status=403)

    @action(detail=False, methods=['get'], url_path='admin-analytics')
    def admin_analytics(self, request):
        """
        Endpoint exclusivo ADMIN: métricas detalladas tipo Power BI.
        Devuelve indicadores de usuarios, asistencia, cursos y sistema.
        """
        import platform, sys, django
        from datetime import datetime, timedelta
        from django.db.models import Avg, Count, Q
        from django.db.models.functions import TruncMonth
        from django.contrib.auth import get_user_model
        from django.utils import timezone

        user = request.user
        if user.role != 'ADMIN' and not user.is_superuser:
            return Response({'error': 'Acceso restringido a administradores'}, status=403)

        User = get_user_model()
        today = date.today()

        # ── 1. Distribución de usuarios por rol ─────────────────────────
        total_users = User.objects.count()
        students_count = User.objects.filter(role='STUDENT').count()
        teachers_count = User.objects.filter(role='TEACHER').count()
        admins_count = User.objects.filter(role='ADMIN').count()

        # ── 2. Registros de nuevos usuarios por mes (últimos 6 meses) ────
        six_months_ago = today - timedelta(days=180)
        monthly_users = (
            User.objects.filter(date_joined__gte=six_months_ago)
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        monthly_users_data = [
            {
                'month': entry['month'].strftime('%b %Y'),
                'count': entry['count']
            }
            for entry in monthly_users
        ]

        # ── 3. Estadísticas globales de cursos ───────────────────────────
        total_courses = Course.objects.count()
        active_courses = Course.objects.filter(year=str(today.year)).count()
        total_sessions = Session.objects.count()

        # ── 4. Asistencia global por mes (últimos 6 meses) ───────────────
        sessions_6m = Session.objects.filter(date__gte=six_months_ago)
        monthly_attendance = []
        for i in range(5, -1, -1):
            month_date = (today.replace(day=1) - timedelta(days=i * 28))
            month_start = month_date.replace(day=1)
            if month_date.month == 12:
                month_end = month_date.replace(year=month_date.year + 1, month=1, day=1)
            else:
                month_end = month_date.replace(month=month_date.month + 1, day=1)

            sessions_in_month = Session.objects.filter(date__gte=month_start, date__lt=month_end)
            total_att = Attendance.objects.filter(session__in=sessions_in_month).count()
            present_att = Attendance.objects.filter(session__in=sessions_in_month, status='PRESENT').count()
            late_att = Attendance.objects.filter(session__in=sessions_in_month, status='LATE').count()
            absent_att = Attendance.objects.filter(session__in=sessions_in_month, status='ABSENT').count()
            rate = round(((present_att + late_att) / total_att) * 100, 1) if total_att > 0 else 0

            monthly_attendance.append({
                'month': month_start.strftime('%b'),
                'rate': rate,
                'present': present_att,
                'absent': absent_att,
                'late': late_att,
                'total': total_att,
            })

        # ── 5. Top 5 cursos por asistencia ───────────────────────────────
        top_courses = []
        for course in Course.objects.all()[:20]:
            sessions = Session.objects.filter(course=course)
            total = Attendance.objects.filter(session__in=sessions).count()
            present = Attendance.objects.filter(session__in=sessions, status='PRESENT').count()
            rate = round((present / total) * 100, 1) if total > 0 else 0
            top_courses.append({
                'name': course.name[:30],
                'code': course.code,
                'students': course.students.count(),
                'sessions': sessions.count(),
                'attendance_rate': rate,
                'teacher': f"{course.teacher.first_name} {course.teacher.last_name}" if course.teacher else 'Sin docente',
            })
        top_courses = sorted(top_courses, key=lambda x: x['attendance_rate'], reverse=True)[:5]

        # ── 6. Rendimiento por docente (top 5) ───────────────────────────
        teacher_stats = []
        for teacher in User.objects.filter(role='TEACHER')[:10]:
            courses = Course.objects.filter(teacher=teacher)
            student_count = sum(c.students.count() for c in courses)
            sessions = Session.objects.filter(course__in=courses)
            total = Attendance.objects.filter(session__in=sessions).count()
            present = Attendance.objects.filter(session__in=sessions, status='PRESENT').count()
            rate = round((present / total) * 100, 1) if total > 0 else 0
            teacher_stats.append({
                'name': f"{teacher.first_name} {teacher.last_name}",
                'courses': courses.count(),
                'students': student_count,
                'attendance_rate': rate,
            })
        teacher_stats = sorted(teacher_stats, key=lambda x: x['attendance_rate'], reverse=True)[:5]

        # ── 7. Asistencia global hoy ─────────────────────────────────────
        today_sessions = Session.objects.filter(date=today)
        today_total = Attendance.objects.filter(session__in=today_sessions).count()
        today_present = Attendance.objects.filter(session__in=today_sessions, status='PRESENT').count()
        today_absent = Attendance.objects.filter(session__in=today_sessions, status='ABSENT').count()
        today_rate = round((today_present / today_total) * 100, 1) if today_total > 0 else 0

        # ── 8. Alertas de estudiantes en riesgo ──────────────────────────
        at_risk_count = 0
        for student in User.objects.filter(role='STUDENT'):
            for course in Course.objects.filter(students=student):
                absences = Attendance.objects.filter(
                    session__course=course, student=student, status='ABSENT'
                ).count()
                if absences >= 3:
                    at_risk_count += 1
                    break

        # ── 9. Info del sistema (servidor) ───────────────────────────────
        from django.conf import settings as django_settings
        python_version = sys.version.split(' ')[0]
        django_version = django.get_version()
        os_info = f"{platform.system()} {platform.release()}"
        db_backend = 'PostgreSQL' if 'psycopg2' in str(sys.modules) else 'SQLite (dev)'
        is_production = not django_settings.DEBUG

        return Response({
            'generated_at': today.isoformat(),
            # KPIs principales
            'kpis': {
                'total_users': total_users,
                'total_students': students_count,
                'total_teachers': teachers_count,
                'total_admins': admins_count,
                'total_courses': total_courses,
                'active_courses': active_courses,
                'total_sessions': total_sessions,
                'at_risk_students': at_risk_count,
                'today_attendance_rate': today_rate,
                'today_present': today_present,
                'today_absent': today_absent,
                'today_sessions': today_sessions.count(),
            },
            # Gráficas
            'charts': {
                'monthly_attendance': monthly_attendance,
                'monthly_new_users': monthly_users_data,
                'top_courses': top_courses,
                'teacher_performance': teacher_stats,
                'user_distribution': [
                    {'label': 'Estudiantes', 'value': students_count, 'color': '#3B82F6'},
                    {'label': 'Docentes', 'value': teachers_count, 'color': '#8B5CF6'},
                    {'label': 'Admins', 'value': admins_count, 'color': '#0EA5E9'},
                ],
            },
            # Info del sistema
            'system': {
                'python_version': python_version,
                'django_version': django_version,
                'os': os_info,
                'database': db_backend,
                'environment': 'Production' if is_production else 'Development',
                'debug_mode': django_settings.DEBUG,
                'total_db_records': {
                    'users': total_users,
                    'courses': total_courses,
                    'sessions': total_sessions,
                    'attendance_records': Attendance.objects.count(),
                },
            }
        })
