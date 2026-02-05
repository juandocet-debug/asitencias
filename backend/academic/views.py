from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from datetime import date
from .models import Course, Session, Attendance
from .serializers import CourseSerializer, SessionSerializer, AttendanceSerializer, AttendanceCreateSerializer

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'TEACHER':
            return Course.objects.filter(teacher=self.request.user)
        return Course.objects.all()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

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
