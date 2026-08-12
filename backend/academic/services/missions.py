import os
import re
import uuid

from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from academic.models import Attendance, Course, Mission, Session

IMAGE_TYPES = {'image/png', 'image/jpeg', 'image/jpg', 'image/webp'}
IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
RESOURCE_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx'}
MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_RESOURCE_SIZE = 10 * 1024 * 1024
YOUTUBE_RE = re.compile(r'^https?://(www\.)?(youtube\.com|youtu\.be)/.+', re.I)


def user_roles(user):
    return set(getattr(user, 'roles', None) or [getattr(user, 'role', '')])


def can_manage_course(user, course):
    roles = user_roles(user)
    return user.is_superuser or 'ADMIN' in roles or course.teacher_id == user.id


def ensure_can_manage_course(user, course):
    if not can_manage_course(user, course):
        raise PermissionDenied('No tienes permiso para gestionar misiones de esta clase.')


def ensure_can_view_mission(user, mission):
    roles = user_roles(user)
    if user.is_superuser or 'ADMIN' in roles or mission.course.teacher_id == user.id:
        return
    if 'STUDENT' in roles and mission.course.students.filter(id=user.id).exists():
        return
    raise PermissionDenied('No tienes permiso para ver esta misión.')


def validate_upload(upload, allowed_exts, max_size, allowed_types=None):
    if not upload:
        return None
    name = os.path.basename(upload.name or '')
    parts = [part.lower() for part in name.split('.') if part]
    if len(parts) < 2:
        raise ValidationError('Nombre de archivo inválido.')
    ext = parts[-1]
    dangerous = {'exe', 'php', 'py', 'sh', 'bat', 'cmd', 'js', 'html', 'cgi', 'pl'}
    if ext not in allowed_exts or any(part in dangerous for part in parts[:-1]):
        raise ValidationError('Tipo de archivo no permitido.')
    content_type = (getattr(upload, 'content_type', '') or '').lower()
    if allowed_types and content_type and content_type not in allowed_types:
        raise ValidationError('Tipo de contenido no válido.')
    if upload.size > max_size:
        raise ValidationError('El archivo supera el tamaño permitido.')
    upload.name = f"{uuid.uuid4().hex}.{ext}"
    return upload


def validate_mission_payload(data, files=None):
    files = files or {}
    image = files.get('image')
    if image:
        validate_upload(image, IMAGE_EXTENSIONS, MAX_IMAGE_SIZE, IMAGE_TYPES)
    resource_file = files.get('file')
    if resource_file:
        validate_upload(resource_file, RESOURCE_EXTENSIONS, MAX_RESOURCE_SIZE)
    if data.get('resource_type') == 'YOUTUBE' and data.get('url'):
        if not YOUTUBE_RE.match(data['url']):
            raise ValidationError('El recurso debe ser un enlace válido de YouTube.')


def latest_attendance_session(course):
    today = timezone.localdate()
    return (
        Session.objects.filter(course=course, date=today).order_by('-id').first()
        or Session.objects.filter(course=course).order_by('-date', '-id').first()
    )


def present_students_for_course(course):
    session = latest_attendance_session(course)
    if not session:
        return {'session_id': None, 'count': 0, 'students': []}
    attendances = Attendance.objects.filter(
        session=session,
        status__in=['PRESENT', 'LATE'],
    ).select_related('student').order_by('student__first_name', 'student__last_name')
    students = [
        {
            'id': item.student.id,
            'name': f"{item.student.first_name} {item.student.last_name}".strip() or item.student.username,
            'photo': item.student.photo.url if item.student.photo else None,
            'status': item.status,
        }
        for item in attendances
    ]
    return {'session_id': session.id, 'count': len(students), 'students': students}


def student_mission_summary(student):
    missions = Mission.objects.filter(
        course__students=student,
        is_active=True,
    ).select_related('course').prefetch_related('resources').order_by('-updated_at')
    mission = missions.first()
    if not mission:
        return {'mission': None, 'online': {'session_id': None, 'count': 0, 'students': []}}
    return {'mission': mission, 'online': present_students_for_course(mission.course)}
