from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from academic.models import Attendance, Course
from academic.serializers import AttendanceSerializer, AttendanceCreateSerializer


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
        attendance_id = request.data.get('attendance_id')
        excuse_note = request.data.get('excuse_note', '')
        excuse_file = request.FILES.get('excuse_file')

        if not attendance_id:
            return Response({'error': 'Falta el ID de asistencia'}, status=400)

        try:
            attendance = Attendance.objects.get(id=attendance_id)

            if attendance.student != request.user:
                return Response({'error': 'No autorizado'}, status=403)

            if attendance.status not in ['ABSENT', 'LATE']:
                return Response({'error': 'Solo puedes subir excusas para faltas o retardos'}, status=400)

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
        attendance_id = request.data.get('attendance_id')
        decision = request.data.get('decision')  # 'APPROVED' o 'REJECTED'

        if not attendance_id or decision not in ['APPROVED', 'REJECTED']:
            return Response({'error': 'Datos inválidos'}, status=400)

        try:
            attendance = Attendance.objects.get(id=attendance_id)

            if attendance.session.course.teacher != request.user:
                return Response({'error': 'No autorizado'}, status=403)

            attendance.excuse_status = decision
            attendance.excuse_reviewed_at = timezone.now()

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
