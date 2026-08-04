from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from academic.models import Attendance, Course, Session


User = get_user_model()


class AttendanceContractTests(TestCase):
    """Caracteriza los contratos que deben sobrevivir la reestructuracion."""

    def setUp(self):
        self.teacher = User.objects.create_user(
            username="teacher",
            password="safe-password",
            role="TEACHER",
            first_name="Ada",
            last_name="Docente",
        )
        self.other_teacher = User.objects.create_user(
            username="other-teacher",
            password="safe-password",
            role="TEACHER",
        )
        self.student = User.objects.create_user(
            username="student",
            password="safe-password",
            role="STUDENT",
            document_number="10001",
            first_name="Ana",
            last_name="Estudiante",
        )
        self.second_student = User.objects.create_user(
            username="student-two",
            password="safe-password",
            role="STUDENT",
            document_number="10002",
        )
        self.course = Course.objects.create(
            teacher=self.teacher,
            name="Arquitectura",
            code="ARCH01",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=90),
        )
        self.course.students.add(self.student, self.second_student)
        self.client = APIClient()

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_bulk_create_supports_every_status_and_updates_without_duplicates(self):
        self.authenticate(self.teacher)
        endpoint = "/api/academic/attendance/bulk_create/"
        payload = {
            "course_id": self.course.id,
            "date": "2026-08-01",
            "attendances": [
                {"student_id": self.student.id, "status": "PRESENT"},
                {"student_id": self.second_student.id, "status": "LATE"},
            ],
        }

        response = self.client.post(endpoint, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Session.objects.count(), 1)
        self.assertEqual(Attendance.objects.count(), 2)

        payload["attendances"] = [
            {"student_id": self.student.id, "status": "ABSENT"},
            {"student_id": self.second_student.id, "status": "EXCUSED"},
        ]
        response = self.client.post(endpoint, payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Session.objects.count(), 1)
        self.assertEqual(Attendance.objects.count(), 2)
        self.assertEqual(
            Attendance.objects.get(student=self.student).status,
            "ABSENT",
        )
        self.assertEqual(
            Attendance.objects.get(student=self.second_student).status,
            "EXCUSED",
        )

    def test_session_attendance_returns_empty_map_until_session_exists(self):
        self.authenticate(self.teacher)
        endpoint = "/api/academic/attendance/session_attendance/"

        response = self.client.get(
            endpoint,
            {"course_id": self.course.id, "date": "2026-08-02"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {})

        missing = self.client.get(endpoint, {"course_id": self.course.id})
        self.assertEqual(missing.status_code, 400)

    def test_session_attendance_returns_student_status_map(self):
        session = Session.objects.create(course=self.course, date="2026-08-02")
        Attendance.objects.create(
            session=session,
            student=self.student,
            status="PRESENT",
        )
        Attendance.objects.create(
            session=session,
            student=self.second_student,
            status="LATE",
        )
        self.authenticate(self.teacher)

        response = self.client.get(
            "/api/academic/attendance/session_attendance/",
            {"course_id": self.course.id, "date": "2026-08-02"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {str(self.student.id): "PRESENT", str(self.second_student.id): "LATE"},
        )

    def test_only_owner_or_admin_can_delete_session_and_attendance_cascades(self):
        session = Session.objects.create(course=self.course, date="2026-08-03")
        Attendance.objects.create(
            session=session,
            student=self.student,
            status="ABSENT",
        )
        endpoint = (
            "/api/academic/attendance/delete_session/"
            f"?course_id={self.course.id}&date=2026-08-03"
        )

        self.authenticate(self.other_teacher)
        denied = self.client.delete(endpoint)
        self.assertEqual(denied.status_code, 403)
        self.assertTrue(Session.objects.filter(pk=session.pk).exists())

        self.authenticate(self.teacher)
        deleted = self.client.delete(endpoint)
        self.assertEqual(deleted.status_code, 200)
        self.assertFalse(Session.objects.filter(pk=session.pk).exists())
        self.assertEqual(Attendance.objects.count(), 0)

    def test_excuse_flow_preserves_rejection_and_converts_approval(self):
        session = Session.objects.create(course=self.course, date="2026-08-04")
        attendance = Attendance.objects.create(
            session=session,
            student=self.student,
            status="ABSENT",
        )

        self.authenticate(self.student)
        submitted = self.client.post(
            "/api/academic/attendance/submit_excuse/",
            {"attendance_id": attendance.id, "excuse_note": "Cita medica"},
            format="json",
        )
        self.assertEqual(submitted.status_code, 200)
        attendance.refresh_from_db()
        self.assertEqual(attendance.excuse_status, "PENDING")
        self.assertIsNotNone(attendance.excuse_submitted_at)

        self.authenticate(self.teacher)
        rejected = self.client.post(
            "/api/academic/attendance/review_excuse/",
            {"attendance_id": attendance.id, "decision": "REJECTED"},
            format="json",
        )
        self.assertEqual(rejected.status_code, 200)
        attendance.refresh_from_db()
        self.assertEqual(attendance.status, "ABSENT")
        self.assertEqual(attendance.excuse_status, "REJECTED")

        approved = self.client.post(
            "/api/academic/attendance/review_excuse/",
            {"attendance_id": attendance.id, "decision": "APPROVED"},
            format="json",
        )
        self.assertEqual(approved.status_code, 200)
        attendance.refresh_from_db()
        self.assertEqual(attendance.status, "EXCUSED")
        self.assertEqual(attendance.excuse_status, "APPROVED")

    def test_student_cannot_submit_excuse_for_another_student(self):
        session = Session.objects.create(course=self.course, date="2026-08-05")
        attendance = Attendance.objects.create(
            session=session,
            student=self.second_student,
            status="LATE",
        )
        self.authenticate(self.student)

        response = self.client.post(
            "/api/academic/attendance/submit_excuse/",
            {"attendance_id": attendance.id, "excuse_note": "No autorizada"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        attendance.refresh_from_db()
        self.assertIsNone(attendance.excuse_status)

    def test_student_report_uses_all_course_sessions_as_denominator(self):
        first = Session.objects.create(course=self.course, date="2026-08-06")
        Session.objects.create(course=self.course, date="2026-08-07")
        Attendance.objects.create(
            session=first,
            student=self.student,
            status="PRESENT",
        )
        self.authenticate(self.teacher)

        response = self.client.get(
            f"/api/academic/courses/{self.course.id}/student_report/"
        )

        self.assertEqual(response.status_code, 200)
        rows = {row["id"]: row for row in response.json()}
        self.assertEqual(rows[self.student.id]["total_sessions"], 2)
        self.assertEqual(rows[self.student.id]["attendance_rate"], 50.0)
        self.assertEqual(rows[self.second_student.id]["attendance_rate"], 0.0)


class CourseVisibilityContractTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="visible-teacher", password="safe", role="TEACHER"
        )
        self.other_teacher = User.objects.create_user(
            username="hidden-teacher", password="safe", role="TEACHER"
        )
        self.student = User.objects.create_user(
            username="visible-student", password="safe", role="STUDENT"
        )
        self.visible = Course.objects.create(
            teacher=self.teacher, name="Visible", code="VIS001"
        )
        self.hidden = Course.objects.create(
            teacher=self.other_teacher, name="Hidden", code="HID001"
        )
        self.visible.students.add(self.student)
        self.client = APIClient()

    def test_teacher_and_student_only_list_related_courses(self):
        self.client.force_authenticate(self.teacher)
        teacher_response = self.client.get("/api/academic/courses/")
        self.assertEqual(teacher_response.status_code, 200)
        self.assertEqual([row["id"] for row in teacher_response.json()], [self.visible.id])

        self.client.force_authenticate(self.student)
        student_response = self.client.get("/api/academic/courses/")
        self.assertEqual(student_response.status_code, 200)
        self.assertEqual([row["id"] for row in student_response.json()], [self.visible.id])
