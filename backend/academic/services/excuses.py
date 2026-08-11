import os
import uuid
import logging
from django.utils import timezone
from academic.models import Attendance

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
ALLOWED_CONTENT_TYPES = {
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_excuse_file(excuse_file):
    if not excuse_file:
        return None

    filename = excuse_file.name or ''

    # Prevenir doble extensión peligrosas (.exe.pdf, .php.png, etc.)
    parts = [p.lower() for p in filename.split('.') if p]
    if len(parts) < 2:
        return 'Nombre de archivo inválido.'

    extension = parts[-1]
    if extension not in ALLOWED_EXTENSIONS:
        return 'Formato de archivo no permitido. Solo PDF o imágenes (PNG, JPG).'

    # Comprobar que ninguna extensión intermedia sea ejecutable/peligrosa
    dangerous_exts = {'exe', 'php', 'py', 'sh', 'bat', 'cmd', 'js', 'html', 'cgi', 'pl'}
    if any(p in dangerous_exts for p in parts[:-1]):
        return 'Extensión de archivo sospechosa o no permitida.'

    # Validar Content-Type
    content_type = getattr(excuse_file, 'content_type', '').lower()
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        return 'Tipo de contenido no válido.'

    # Validar Tamaño
    if excuse_file.size > MAX_FILE_SIZE:
        return 'El archivo supera el tamaño máximo permitido de 5 MB.'

    # Renombrar de forma segura con UUID conservando solo la extensión final legítima
    safe_name = f"excuses/{uuid.uuid4().hex}.{extension}"
    excuse_file.name = safe_name
    return None


def submit_student_excuse(student, attendance_id, excuse_note, excuse_file=None):
    if not attendance_id:
        return None, 'Falta el ID de asistencia.', 400

    try:
        attendance = Attendance.objects.select_related('session', 'session__course').get(id=attendance_id)
        
        if attendance.student != student:
            return None, 'No estás autorizado para enviar excusa para esta asistencia.', 403

        if attendance.status not in ['ABSENT', 'LATE']:
            return None, 'Solo puedes subir excusas para faltas o retardos.', 400

        if excuse_file:
            validation_error = validate_excuse_file(excuse_file)
            if validation_error:
                return None, validation_error, 400
            attendance.excuse_file = excuse_file

        attendance.excuse_note = (excuse_note or '').strip()
        attendance.excuse_status = 'PENDING'
        attendance.excuse_submitted_at = timezone.now()
        attendance.save()

        return attendance, None, 200
    except Attendance.DoesNotExist:
        return None, 'Registro de asistencia no encontrado.', 404
    except Exception as e:
        logger.error(f'Error procesando excusa: {e}', exc_info=True)
        return None, 'Ocurrió un error interno al procesar la solicitud.', 500


def review_excuse_by_teacher(teacher, attendance_id, decision):
    if not attendance_id or decision not in ['APPROVED', 'REJECTED']:
        return None, 'Datos de revisión inválidos.', 400

    try:
        attendance = Attendance.objects.select_related('session', 'session__course', 'session__course__teacher').get(id=attendance_id)
        
        course = attendance.session.course
        roles = getattr(teacher, 'roles', None) or [getattr(teacher, 'role', '')]
        is_admin = 'ADMIN' in roles or getattr(teacher, 'is_superuser', False)

        if not is_admin and course.teacher != teacher:
            return None, 'No estás autorizado para revisar excusas de este curso.', 403

        attendance.excuse_status = decision
        attendance.excuse_reviewed_at = timezone.now()
        if decision == 'APPROVED':
            attendance.status = 'EXCUSED'

        attendance.save()
        return attendance, None, 200
    except Attendance.DoesNotExist:
        return None, 'Registro de asistencia no encontrado.', 404
    except Exception as e:
        logger.error(f'Error en revisión de excusa: {e}', exc_info=True)
        return None, 'Ocurrió un error interno al procesar la revisión.', 500
