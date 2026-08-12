from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from academic.models import Attendance, Course, Mission, Session

User = get_user_model()


class MissionSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(username='teacher', role='TEACHER')
        self.other_teacher = User.objects.create_user(username='other', role='TEACHER')
        self.student = User.objects.create_user(username='student', role='STUDENT')
        self.outsider = User.objects.create_user(username='outsider', role='STUDENT')
        self.course = Course.objects.create(teacher=self.teacher, name='Creatividad', code='MIS01')
        self.course.students.add(self.student)
        self.session = Session.objects.create(course=self.course, date=date.today())
        Attendance.objects.create(session=self.session, student=self.student, status='PRESENT')

    def test_owner_teacher_can_create_mission(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post('/api/academic/missions/', {
            'course': self.course.id,
            'name': 'Reto cooperativo',
            'description': 'Trabajo por equipos',
            'group_size': 4,
            'inventory_name': 'Escudo neon',
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Mission.objects.count(), 1)

    def test_other_teacher_cannot_create_mission(self):
        self.client.force_authenticate(self.other_teacher)
        response = self.client.post('/api/academic/missions/', {
            'course': self.course.id,
            'name': 'Reto ajeno',
        })
        self.assertEqual(response.status_code, 403)

    def test_student_sees_only_enrolled_mission_summary(self):
        Mission.objects.create(course=self.course, name='Misión activa', group_size=3)
        self.client.force_authenticate(self.student)
        response = self.client.get('/api/academic/missions/student-summary/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['mission']['name'], 'Misión activa')
        self.assertEqual(response.json()['online']['count'], 1)

    def test_outsider_does_not_see_mission_summary(self):
        Mission.objects.create(course=self.course, name='Misión privada', group_size=3)
        self.client.force_authenticate(self.outsider)
        response = self.client.get('/api/academic/missions/student-summary/')
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()['mission'])

    def test_invalid_youtube_resource_is_rejected(self):
        mission = Mission.objects.create(course=self.course, name='Video misión')
        self.client.force_authenticate(self.teacher)
        response = self.client.post(f'/api/academic/missions/{mission.id}/resources/', {
            'title': 'Video',
            'resource_type': 'YOUTUBE',
            'url': 'https://example.com/video',
        })
        self.assertEqual(response.status_code, 400)
