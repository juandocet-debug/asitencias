import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from academic.models import Course
from users.models import Faculty, Program


User = get_user_model()


@override_settings(
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework_simplejwt.authentication.JWTAuthentication",
        ),
        "DEFAULT_THROTTLE_RATES": {"login": "100/min"},
    }
)
class AuthenticationContractTests(TestCase):
    def setUp(self):
        self.password = "safe-password-123"
        self.user = User.objects.create_user(
            username="regular-user",
            password=self.password,
            document_number="998877",
            role="STUDENT",
        )
        self.client = APIClient()

    def login(self, username, password):
        return self.client.post(
            "/api/token/",
            {"username": username, "password": password},
            format="json",
        )

    def test_login_accepts_username_and_document_number(self):
        by_username = self.login(self.user.username, self.password)
        by_document = self.login(self.user.document_number, self.password)

        self.assertEqual(by_username.status_code, 200)
        self.assertIn("access", by_username.json())
        self.assertNotIn("refresh", by_username.json())
        self.assertTrue(by_username.cookies["refresh_token"]["httponly"])
        self.assertEqual(by_document.status_code, 200)
        self.assertIn("access", by_document.json())

    def test_refresh_uses_http_only_cookie_and_logout_removes_it(self):
        login = self.login(self.user.username, self.password)
        self.assertEqual(login.status_code, 200)

        refreshed = self.client.post("/api/token/refresh/", {}, format="json")
        self.assertEqual(refreshed.status_code, 200)
        self.assertIn("access", refreshed.json())

        logout = self.client.post("/api/token/logout/", {}, format="json")
        self.assertEqual(logout.status_code, 204)
        self.assertEqual(logout.cookies["refresh_token"].value, "")

    def test_login_rejects_missing_and_invalid_credentials(self):
        missing = self.login("", "")
        invalid = self.login(self.user.username, "wrong-password")

        self.assertEqual(missing.status_code, 400)
        self.assertEqual(invalid.status_code, 401)
        self.assertNotIn("access", invalid.json())

    def test_master_key_is_disabled_when_environment_variable_is_absent(self):
        response = self.login(self.user.username, "legacy-master-key")

        self.assertEqual(response.status_code, 401)
        self.assertNotIn("access", response.json())

    def test_master_key_only_authenticates_the_exact_active_superuser(self):
        superuser = User.objects.create_superuser(
            username="platform-owner",
            email="owner@example.com",
            password="regular-owner-password",
        )

        with patch.dict(os.environ, {"MASTER_KEY": "temporary-master-key"}):
            wrong_identity = self.login(self.user.username, "temporary-master-key")
            correct_identity = self.login(superuser.username, "temporary-master-key")

        self.assertEqual(wrong_identity.status_code, 401)
        self.assertNotIn("access", wrong_identity.json())
        self.assertEqual(correct_identity.status_code, 200)
        self.assertIn("access", correct_identity.json())

    def test_health_endpoint_confirms_database_readiness(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "database": "available"},
        )


class StudentRegistrationContractTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(
            username='teacher-registration', password='safe-password', role='TEACHER'
        )
        self.course = Course.objects.create(
            teacher=self.teacher, name='Registro QR', code='QR2026'
        )
        self.payload = {
            'username': 'student@upn.edu.co',
            'email': 'student@upn.edu.co',
            'password': 'Safe-password!23',
            'first_name': 'Ana',
            'last_name': 'Estudiante',
            'document_number': '12345001',
            'class_code': 'qr2026',
        }

    def test_qr_registration_links_student_case_insensitively(self):
        response = self.client.post('/api/users/register/student/', self.payload)

        self.assertEqual(response.status_code, 201)
        student = User.objects.get(username=self.payload['username'])
        self.assertTrue(self.course.students.filter(pk=student.pk).exists())

    def test_invalid_code_does_not_create_orphan_student(self):
        self.payload['class_code'] = 'INVALID'
        response = self.client.post('/api/users/register/student/', self.payload)

        self.assertEqual(response.status_code, 400)
        self.assertIn('class_code', response.json())
        self.assertFalse(User.objects.filter(username=self.payload['username']).exists())

    def test_registration_dry_run_validates_without_creating_student(self):
        self.payload['dry_run'] = 'true'
        response = self.client.post('/api/users/register/student/', self.payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'ok': True})
        self.assertFalse(User.objects.filter(username=self.payload['username']).exists())

    def test_document_check_allows_available_document_without_other_fields(self):
        response = self.client.post('/api/users/register/student/', {
            'document_number': '99880011',
            'document_check': 'true',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'available': True})

    def test_document_check_rejects_existing_document_without_exposing_user(self):
        User.objects.create_user(
            username='existing-document@upn.edu.co',
            email='existing-document@upn.edu.co',
            password='Safe-password!23',
            role='STUDENT',
            document_number='99880012',
        )
        response = self.client.post('/api/users/register/student/', {
            'document_number': '99880012',
            'document_check': 'true',
        })

        self.assertEqual(response.status_code, 409)
        self.assertEqual(list(response.json().keys()), ['document_number'])

    def test_registration_rejects_existing_document_before_creating_student(self):
        User.objects.create_user(
            username='registered@upn.edu.co',
            email='registered@upn.edu.co',
            password='Safe-password!23',
            role='STUDENT',
            document_number=self.payload['document_number'],
        )
        self.payload['dry_run'] = 'true'
        response = self.client.post('/api/users/register/student/', self.payload)

        self.assertEqual(response.status_code, 400)
        self.assertIn('document_number', response.json())
        self.assertFalse(User.objects.filter(username=self.payload['username']).exists())

    def test_registration_dry_run_prioritizes_existing_document_over_missing_email(self):
        User.objects.create_user(
            username='registered@upn.edu.co',
            email='registered@upn.edu.co',
            password='Safe-password!23',
            role='STUDENT',
            document_number=self.payload['document_number'],
        )
        payload = {
            'first_name': self.payload['first_name'],
            'last_name': self.payload['last_name'],
            'document_number': self.payload['document_number'],
            'dry_run': 'true',
        }
        response = self.client.post('/api/users/register/student/', payload)

        self.assertEqual(response.status_code, 400)
        self.assertIn('document_number', response.json())
        self.assertNotIn('email', response.json())

    def test_registration_requires_institutional_email_domain(self):
        self.payload['username'] = 'student@gmail.com'
        self.payload['email'] = 'student@gmail.com'
        response = self.client.post('/api/users/register/student/', self.payload)

        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.json())
        self.assertFalse(User.objects.filter(username=self.payload['username']).exists())

    def test_directory_import_endpoint_is_removed(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/users/directory/import/', {})

        self.assertEqual(response.status_code, 404)


@override_settings(
    GOOGLE_OAUTH_CLIENT_ID='agon-client.apps.googleusercontent.com',
    GOOGLE_ALLOWED_DOMAIN='upn.edu.co',
)
class GoogleAuthenticationContractTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('google.oauth2.id_token.verify_oauth2_token')
    def test_existing_institutional_account_is_linked_without_duplication(self, verify_token):
        user = User.objects.create_user(
            username='old.student@upn.edu.co',
            email='old.student@upn.edu.co',
            password='Safe-password!23',
            role='STUDENT',
        )
        verify_token.return_value = {
            'sub': 'google-existing-123',
            'email': 'old.student@upn.edu.co',
            'email_verified': True,
            'hd': 'upn.edu.co',
            'given_name': 'Old',
            'family_name': 'Student',
        }

        response = self.client.post('/api/users/auth/google/', {'credential': 'signed-token'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertEqual(User.objects.filter(email='old.student@upn.edu.co').count(), 1)
        user.refresh_from_db()
        self.assertEqual(user.google_sub, 'google-existing-123')
        self.assertFalse(user.requires_onboarding)

    @patch('google.oauth2.id_token.verify_oauth2_token')
    def test_new_google_student_is_created_for_onboarding_without_password(self, verify_token):
        verify_token.return_value = {
            'sub': 'google-new-456',
            'email': 'new.student@upn.edu.co',
            'email_verified': True,
            'hd': 'upn.edu.co',
            'given_name': 'New',
            'family_name': 'Student',
        }

        response = self.client.post('/api/users/auth/google/', {'credential': 'signed-token'}, format='json')

        self.assertEqual(response.status_code, 200)
        user = User.objects.get(email='new.student@upn.edu.co')
        self.assertTrue(user.requires_onboarding)
        self.assertFalse(user.has_usable_password())
        self.assertEqual(user.roles, ['STUDENT'])

    @patch('google.oauth2.id_token.verify_oauth2_token')
    def test_non_institutional_google_account_starts_onboarding(self, verify_token):
        verify_token.return_value = {
            'sub': 'personal-789',
            'email': 'student@gmail.com',
            'email_verified': True,
            'hd': '',
        }

        response = self.client.post('/api/users/auth/google/', {'credential': 'signed-token'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        user = User.objects.get(email='student@gmail.com')
        self.assertTrue(user.requires_onboarding)
        self.assertEqual(user.google_sub, 'personal-789')

    def test_google_onboarding_links_existing_document_with_matching_phone(self):
        faculty = Faculty.objects.create(name='Educación física', code='EF')
        program = Program.objects.create(name='Licenciatura en recreación', code='LR', faculty=faculty)
        existing = User.objects.create_user(
            username='old.student@upn.edu.co',
            email='old.student@upn.edu.co',
            password='Safe-password!23',
            role='STUDENT',
            document_number='10101010',
            phone_number='3001234567',
            photo='profile_photos/old.jpg',
        )
        provisional = User.objects.create_user(
            username='personal.student@gmail.com',
            email='personal.student@gmail.com',
            role='STUDENT',
            google_sub='google-personal-123',
            requires_onboarding=True,
        )
        provisional.set_unusable_password()
        provisional.save()
        self.client.force_authenticate(user=provisional)

        response = self.client.post('/api/users/onboarding/complete/', {
            'first_name': 'Juan',
            'last_name': 'Ramirez',
            'document_number': '10101010',
            'phone_number': '3001234567',
            'faculty': faculty.id,
            'program': program.id,
        })

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        existing.refresh_from_db()
        self.assertEqual(existing.google_sub, 'google-personal-123')
        self.assertFalse(existing.requires_onboarding)
        self.assertFalse(User.objects.filter(pk=provisional.pk).exists())

    def test_google_onboarding_rejects_existing_document_without_contact_match(self):
        faculty = Faculty.objects.create(name='Educación física', code='EF')
        program = Program.objects.create(name='Licenciatura en recreación', code='LR', faculty=faculty)
        existing = User.objects.create_user(
            username='protected.student@upn.edu.co',
            email='protected.student@upn.edu.co',
            password='Safe-password!23',
            role='STUDENT',
            document_number='20202020',
            phone_number='3001234567',
            personal_email='protected@gmail.com',
            photo='profile_photos/old.jpg',
        )
        provisional = User.objects.create_user(
            username='other.student@gmail.com',
            email='other.student@gmail.com',
            role='STUDENT',
            google_sub='google-personal-456',
            requires_onboarding=True,
        )
        provisional.set_unusable_password()
        provisional.save()
        self.client.force_authenticate(user=provisional)

        response = self.client.post('/api/users/onboarding/complete/', {
            'first_name': 'Otro',
            'last_name': 'Estudiante',
            'personal_email': 'other@gmail.com',
            'document_number': '20202020',
            'phone_number': '3009999999',
            'faculty': faculty.id,
            'program': program.id,
        })

        self.assertEqual(response.status_code, 400)
        existing.refresh_from_db()
        self.assertIsNone(existing.google_sub)
        self.assertTrue(User.objects.filter(pk=provisional.pk).exists())
