import hashlib
import hmac
import random
import string
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from academic.models import Attendance, Course, Session

ROTATION_SECONDS = 30


def open_self_checkin_for_teacher(user, course_id, minutes=10):
    course = _get_manageable_course(user, course_id)
    session, _ = Session.objects.get_or_create(
        course=course,
        date=timezone.localdate(),
    )
    now = timezone.now()
    session.self_checkin_enabled = True
    session.self_checkin_code = _seed()
    session.self_checkin_opened_at = now
    session.self_checkin_expires_at = now + timedelta(
        minutes=max(3, min(int(minutes or 10), 30))
    )
    session.save(update_fields=[
        'self_checkin_enabled',
        'self_checkin_code',
        'self_checkin_opened_at',
        'self_checkin_expires_at',
    ])
    return _teacher_payload(session)


def get_self_checkin_for_teacher(user, session_id):
    session = Session.objects.select_related('course').get(id=session_id)
    _get_manageable_course(user, session.course_id)
    if not _is_open(session):
        return None
    return _teacher_payload(session)


def list_open_checkins_for_student(user):
    if not _has_role(user, 'STUDENT'):
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
        'code_expires_in': _code_expires_in(),
        'already_marked': session.id in marked_ids,
    } for session in sessions]


def mark_student_self_checkin(user, session_id, code):
    session = Session.objects.select_related('course').get(id=session_id)
    if not session.course.students.filter(id=user.id).exists():
        return None, 'No estás inscrito en esta clase', 403, None
    if not _is_open(session):
        return None, 'La ventana de asistencia ya cerró', 400, None
    if str(code or '').strip().upper() not in _valid_codes(session):
        return None, 'Código de asistencia inválido o vencido', 400, None

    status = _status_for_checkin(session)
    attendance, _ = Attendance.objects.update_or_create(
        session=session,
        student=user,
        defaults={'status': status},
    )
    return attendance, None, None, _reward_for(user, attendance)


def _get_manageable_course(user, course_id):
    courses = Course.objects.filter(id=course_id, is_archived=False)
    if not (getattr(user, 'is_superuser', False) or _has_role(user, 'ADMIN')):
        courses = courses.filter(teacher=user)
    return courses.get()


def _has_role(user, role):
    roles = getattr(user, 'roles', None) or [getattr(user, 'role', '')]
    return role in roles


def _is_open(session):
    return (
        session.self_checkin_enabled
        and session.self_checkin_expires_at
        and session.self_checkin_expires_at > timezone.now()
    )


def _teacher_payload(session):
    return {
        'session_id': session.id,
        'course': session.course.name,
        'code': _current_code(session),
        'expires_at': session.self_checkin_expires_at.isoformat(),
        'code_expires_in': _code_expires_in(),
    }


def _current_code(session, offset=0):
    window = int(timezone.now().timestamp() // ROTATION_SECONDS) + offset
    raw = f'{session.id}:{session.self_checkin_code}:{window}'.encode()
    secret = settings.SECRET_KEY.encode()
    digest = hmac.new(secret, raw, hashlib.sha256).hexdigest().upper()
    return ''.join(char for char in digest if char.isalnum())[:6]


def _valid_codes(session):
    return {_current_code(session), _current_code(session, -1)}


def _code_expires_in():
    elapsed = int(timezone.now().timestamp()) % ROTATION_SECONDS
    return ROTATION_SECONDS - elapsed


def _status_for_checkin(session):
    opened_at = session.self_checkin_opened_at or timezone.now()
    return 'PRESENT' if timezone.now() <= opened_at + timedelta(minutes=20) else 'LATE'


def _reward_for(user, attendance):
    if attendance.status == 'LATE':
        return {
            'title': 'Registro recibido',
            'message': 'Llegaste tarde, pero quedó registrado. Recupera ritmo en la próxima.',
            'icon': '⏰',
            'points': 2,
            'badge_awarded': False,
        }
    return {
        'title': '¡Asistencia confirmada!',
        'message': 'Llegaste a tiempo. Sumaste una estrella de asistencia.',
        'icon': '⭐',
        'points': 10,
        'badge_awarded': _award_first_badge(user),
    }


def _award_first_badge(user):
    try:
        from gamification.models import Badge, UserBadge
        badge, _ = Badge.objects.get_or_create(
            name='Primera estrella',
            defaults={
                'description': 'Primera asistencia marcada a tiempo.',
                'icon': 'star',
                'criteria': 'first_on_time_checkin',
            },
        )
        _, created = UserBadge.objects.get_or_create(user=user, badge=badge)
        return created
    except Exception:
        return False


def _seed():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
