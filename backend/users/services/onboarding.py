import re

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from users.models import Faculty, Program, User

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


def complete_student_onboarding(
    user,
    password,
    phone_number,
    photo=None,
    document_number='',
    faculty_id=None,
    program_id=None,
):
    if user.role != 'STUDENT':
        raise serializers.ValidationError('Solo estudiantes pueden completar este flujo.')
    google_user = bool(user.google_sub)
    if google_user:
        document = str(document_number or '').strip()
        if not document.isdigit():
            raise serializers.ValidationError('Ingresa un número de documento válido.')
        if User.objects.exclude(pk=user.pk).filter(document_number=document).exists():
            raise serializers.ValidationError('Este documento ya está vinculado a otra cuenta.')
        if not photo and not user.photo:
            raise serializers.ValidationError('La foto de perfil es obligatoria.')
        try:
            faculty = Faculty.objects.get(pk=faculty_id)
            program = Program.objects.get(pk=program_id, faculty=faculty)
        except (Faculty.DoesNotExist, Program.DoesNotExist, TypeError, ValueError):
            raise serializers.ValidationError('Selecciona una facultad y un programa válidos.')
        user.document_number = document
        user.faculty = faculty
        user.program = program
    else:
        validate_student_password(password)
        user.set_password(password)
    user.phone_number = phone_number
    if photo:
        user.photo = photo
    user.requires_onboarding = False
    update_fields = ['phone_number', 'photo', 'requires_onboarding']
    if google_user:
        update_fields.extend(['document_number', 'faculty', 'program'])
    else:
        update_fields.append('password')
    user.save(update_fields=update_fields)
    return user
