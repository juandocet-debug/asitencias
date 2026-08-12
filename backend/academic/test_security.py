from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from academic.models import Attendance, Course, Session

User = get_user_model()


class AdditionalSecurityTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(username="prof1", role="TEACHER")
        self.other_teacher = User.objects.create_user(username="prof2", role="TEACHER")
        self.student = User.objects.create_user(username="stud1", role="STUDENT")
        self.other_student = User.objects.create_user(username="stud2", role="STUDENT")
        self.course = Course.objects.create(teacher=self.teacher, name="Fisica", code="FIS01")
        self.course.students.add(self.student)
        self.session = Session.objects.create(course=self.course, date=date.today())
        self.attendance = Attendance.objects.create(session=self.session, student=self.student, status="ABSENT")
        self.client = APIClient()

    def test_student_cannot_view_course_sessions(self):
        self.client.force_authenticate(self.student)
        res = self.client.get(f"/api/academic/attendance/course_sessions/?course_id={self.course.id}")
        self.assertEqual(res.status_code, 403)

    def test_student_cannot_submit_excuse_for_another_student(self):
        self.client.force_authenticate(self.other_student)
        res = self.client.post("/api/academic/attendance/submit_excuse/", {
            "attendance_id": self.attendance.id,
            "excuse_note": "Fui al médico",
        })
        self.assertEqual(res.status_code, 403)

    def test_student_cannot_call_bulk_create(self):
        self.client.force_authenticate(self.student)
        res = self.client.post(
            "/api/academic/attendance/bulk_create/",
            self._attendance_payload(),
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_other_teacher_cannot_call_bulk_create(self):
        self.client.force_authenticate(self.other_teacher)
        res = self.client.post(
            "/api/academic/attendance/bulk_create/",
            self._attendance_payload(),
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_owner_teacher_can_call_bulk_create(self):
        self.client.force_authenticate(self.teacher)
        res = self.client.post(
            "/api/academic/attendance/bulk_create/",
            self._attendance_payload(),
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    def test_admin_can_call_bulk_create(self):
        admin = User.objects.create_user(username="adminuser", role="ADMIN", is_superuser=True)
        self.client.force_authenticate(admin)
        res = self.client.post(
            "/api/academic/attendance/bulk_create/",
            self._attendance_payload(),
            format="json",
        )
        self.assertEqual(res.status_code, 201)

    def _attendance_payload(self):
        return {
            "course_id": self.course.id,
            "date": "2026-08-11",
            "attendances": [{"student_id": self.student.id, "status": "PRESENT"}],
        }
