import random
import string
from datetime import timedelta

from django.utils import timezone

from academic.models import Attendance, Course, Session


def open_self_checkin_for_teacher(user, course_id, minutes=10):
    course = _get_manageable_course(user, course_id)
    session, _ = Session.objects.get_or_create(
        course=course,
        date=timezone.localdate(),
    )
    session.self_checkin_enabled = True
    session.self_checkin_code = _code()
    session.self_checkin_expires_at = timezone.now() + timedelta(
        minutes=max(3, min(int(minutes or 10), 30))
    )
    session.save(update_fields=[
        'self_checkin_enabled',
        'self_checkin_code',
        'self_checkin_expires_at',
    ])
    return {
        'session_id': session.id,
        'course': course.name,
        'code': session.self_checkin_code,
        'expires_at': session.self_checkin_expires_at.isoformat(),
    }


def list_open_checkins_for_student(user):
    if user.role != 'STUDENT':
        return []

    sessions = Session.objects.filter(
        course__students=user,
        self_checkin_enabled=True,
        self_checkin_expires_at__gt=timezone.now(),
    ).select_related('course').order_by('self_checkin_expires_at')

    marked_ids = set(Attendance.objects.filter(
        student=user,
        session_id__in=sessions.values_list('id', flat=True),
    ).values_list('session_id', flat=True))

    return [{
        'session_id': session.id,
        'course_id': session.course_id,
        'course_name': session.course.name,
        'date': session.date.isoformat(),
        'expires_at': session.self_checkin_expires_at.isoformat(),
        'already_marked': session.id in marked_ids,
    } for session in sessions]


def mark_student_self_checkin(user, session_id, code):
    session = Session.objects.select_related('course').get(id=session_id)
    if not session.course.students.filter(id=user.id).exists():
        return None, 'No estás inscrito en esta clase', 403
    if not _is_open(session):
        return None, 'La ventana de asistencia ya cerró', 400
    if session.self_checkin_code.upper() != str(code or '').strip().upper():
        return None, 'Código de asistencia inválido', 400

    attendance, _ = Attendance.objects.update_or_create(
        session=session,
        student=user,
        defaults={'status': 'PRESENT'},
    )
    return attendance, None, None


def _get_manageable_course(user, course_id):
    courses = Course.objects.filter(id=course_id)
    if not (getattr(user, 'is_superuser', False) or user.role == 'ADMIN'):
        courses = courses.filter(teacher=user)
    return courses.get()


def _is_open(session):
    return (
        session.self_checkin_enabled
        and session.self_checkin_expires_at
        and session.self_checkin_expires_at > timezone.now()
    )


def _code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
