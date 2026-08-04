import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


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
        self.assertIn("refresh", by_username.json())
        self.assertEqual(by_document.status_code, 200)
        self.assertIn("access", by_document.json())

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
