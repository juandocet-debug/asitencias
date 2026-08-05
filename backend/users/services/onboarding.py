import re

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

PASSWORD_RULES = [
    (r'[A-Z]', 'una letra mayúscula'),
    (r'[a-z]', 'una letra minúscula'),
    (r'[^A-Za-z0-9]', 'un carácter especial'),
]


def validate_student_password(password):
    if len(password or '') < 8:
        raise serializers.ValidationError('La contraseña debe tener al menos 8 caracteres.')
    missing = [label for pattern, label in PASSWORD_RULES if not re.search(pattern, password)]
    if missing:
        raise serializers.ValidationError(f"La contraseña debe incluir {', '.join(missing)}.")
    validate_password(password)


def complete_student_onboarding(user, password, phone_number, photo=None):
    if user.role != 'STUDENT':
        raise serializers.ValidationError('Solo estudiantes pueden completar este flujo.')
    validate_student_password(password)
    user.set_password(password)
    user.phone_number = phone_number
    if photo:
        user.photo = photo
    user.requires_onboarding = False
    user.save(update_fields=['password', 'phone_number', 'photo', 'requires_onboarding'])
    return user
