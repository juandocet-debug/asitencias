from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from academic.models import Attendance, Course, Session
from academic.services.self_checkin import _current_code
from users.models import User


class SelfCheckinTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(
            username='checkin-teacher', password='pass', role='TEACHER'
        )
        self.other_teacher = User.objects.create_user(
            username='other-checkin-teacher', password='pass', role='TEACHER'
        )
        self.student = User.objects.create_user(
            username='checkin-student', password='pass', role='STUDENT'
        )
        self.outsider = User.objects.create_user(
            username='checkin-outsider', password='pass', role='STUDENT'
        )
        self.course = Course.objects.create(
            teacher=self.teacher,
            name='Curso de prueba',
            code='CHK001',
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=30),
        )
        self.course.students.add(self.student)

    def _open(self, user=None):
        self.client.force_authenticate(user=user or self.teacher)
        return self.client.post(
            '/api/academic/attendance/open_self_checkin/',
            {'course_id': self.course.id, 'minutes': 10},
            format='json',
        )

    def test_owner_opens_window_and_enrolled_student_checks_in(self):
        opened = self._open()
        self.assertEqual(opened.status_code, 200)
        self.assertEqual(len(opened.data['code']), 6)

        self.client.force_authenticate(user=self.student)
        available = self.client.get('/api/academic/attendance/my_open_checkins/')
        self.assertEqual(available.status_code, 200)
        self.assertEqual(len(available.data), 1)

        checked = self.client.post(
            '/api/academic/attendance/self_checkin/',
            {'session_id': opened.data['session_id'], 'code': opened.data['code']},
            format='json',
        )
        self.assertEqual(checked.status_code, 200)
        self.assertEqual(checked.data['status'], 'PRESENT')
        self.assertEqual(Attendance.objects.count(), 1)

    def test_repeated_checkin_is_idempotent(self):
        opened = self._open()
        self.client.force_authenticate(user=self.student)
        payload = {'session_id': opened.data['session_id'], 'code': opened.data['code']}
        first = self.client.post('/api/academic/attendance/self_checkin/', payload, format='json')
        second = self.client.post('/api/academic/attendance/self_checkin/', payload, format='json')

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data['attendance_id'], second.data['attendance_id'])
        self.assertEqual(Attendance.objects.count(), 1)

    def test_outsider_and_other_teacher_are_rejected(self):
        opened = self._open()
        self.assertEqual(self._open(self.other_teacher).status_code, 404)

        self.client.force_authenticate(user=self.outsider)
        denied = self.client.post(
            '/api/academic/attendance/self_checkin/',
            {'session_id': opened.data['session_id'], 'code': opened.data['code']},
            format='json',
        )
        self.assertEqual(denied.status_code, 403)
        self.assertEqual(Attendance.objects.count(), 0)

    def test_invalid_and_expired_codes_are_rejected(self):
        opened = self._open()
        self.client.force_authenticate(user=self.student)
        invalid = self.client.post(
            '/api/academic/attendance/self_checkin/',
            {'session_id': opened.data['session_id'], 'code': 'BAD999'},
            format='json',
        )
        self.assertEqual(invalid.status_code, 400)

        session = Session.objects.get(id=opened.data['session_id'])
        session.self_checkin_expires_at = timezone.now() - timedelta(seconds=1)
        session.save(update_fields=['self_checkin_expires_at'])
        expired = self.client.post(
            '/api/academic/attendance/self_checkin/',
            {'session_id': session.id, 'code': _current_code(session)},
            format='json',
        )
        self.assertEqual(expired.status_code, 400)
        self.assertEqual(Attendance.objects.count(), 0)

    def test_multi_role_student_and_admin_are_supported(self):
        admin = User.objects.create_user(
            username='checkin-admin', password='pass', role='COORDINATOR',
            roles=['COORDINATOR', 'ADMIN'],
        )
        multi_student = User.objects.create_user(
            username='multi-student', password='pass', role='COORDINATOR',
            roles=['COORDINATOR', 'STUDENT'],
        )
        self.course.students.add(multi_student)

        opened = self._open(admin)
        self.assertEqual(opened.status_code, 200)
        self.client.force_authenticate(user=multi_student)
        available = self.client.get('/api/academic/attendance/my_open_checkins/')
        self.assertEqual(len(available.data), 1)
        checked = self.client.post(
            '/api/academic/attendance/self_checkin/',
            {'session_id': opened.data['session_id'], 'code': opened.data['code']},
            format='json',
        )
        self.assertEqual(checked.status_code, 200)

    def test_archived_course_cannot_open_a_window(self):
        self.course.archive()
        self.assertEqual(self._open().status_code, 404)
