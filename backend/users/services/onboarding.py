import re

from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
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
    first_name='',
    second_name='',
    last_name='',
    second_lastname='',
    personal_email='',
    document_number='',
    faculty_id=None,
    program_id=None,
):
    if user.role != 'STUDENT':
        raise serializers.ValidationError('Solo estudiantes pueden completar este flujo.')
    google_user = bool(user.google_sub)
    if google_user:
        first = str(first_name or '').strip()
        last = str(last_name or '').strip()
        personal = str(personal_email or '').strip().lower()
        if not first:
            raise serializers.ValidationError('El primer nombre es obligatorio.')
        if not last:
            raise serializers.ValidationError('El primer apellido es obligatorio.')
        if personal:
            try:
                validate_email(personal)
            except Exception:
                raise serializers.ValidationError('Ingresa un correo personal válido.')
        document = str(document_number or '').strip()
        if not document.isdigit():
            raise serializers.ValidationError('Ingresa un número de documento válido.')
        try:
            faculty = Faculty.objects.get(pk=faculty_id)
            program = Program.objects.get(pk=program_id, faculty=faculty)
        except (Faculty.DoesNotExist, Program.DoesNotExist, TypeError, ValueError):
            raise serializers.ValidationError('Selecciona una facultad y un programa válidos.')
        existing = User.objects.exclude(pk=user.pk).filter(document_number=document).first()
        if existing:
            if existing.google_sub and existing.google_sub != user.google_sub:
                raise serializers.ValidationError('Este documento ya tiene un acceso de Google vinculado.')
            if not _matches_existing_contact(existing, phone_number, personal, user.email):
                raise serializers.ValidationError(
                    'Para proteger tu cuenta, el celular o correo personal debe coincidir con el registro existente.'
                )
            google_sub = user.google_sub
            user.google_sub = None
            user.save(update_fields=['google_sub'])
            target = existing
            target.google_sub = google_sub
        else:
            target = user
        if not photo and not target.photo:
            raise serializers.ValidationError('La foto de perfil es obligatoria.')
        user.document_number = document
        target.document_number = document
        target.first_name = first
        target.second_name = str(second_name or '').strip()
        target.last_name = last
        target.second_lastname = str(second_lastname or '').strip()
        target.personal_email = personal or target.personal_email
        target.phone_number = phone_number
        target.faculty = faculty
        target.program = program
        if photo:
            target.photo = photo
        target.requires_onboarding = False
        target.save(update_fields=[
            'google_sub', 'first_name', 'second_name', 'last_name', 'second_lastname',
            'personal_email', 'phone_number', 'document_number', 'faculty', 'program',
            'photo', 'requires_onboarding',
        ])
        if existing:
            user.delete()
        return target
    else:
        validate_student_password(password)
        user.set_password(password)
    user.phone_number = phone_number
    if photo:
        user.photo = photo
    user.requires_onboarding = False
    update_fields = ['phone_number', 'photo', 'requires_onboarding']
    if google_user:
        update_fields.extend(['first_name', 'second_name', 'last_name', 'second_lastname', 'personal_email', 'document_number', 'faculty', 'program'])
    else:
        update_fields.append('password')
    user.save(update_fields=update_fields)
    return user


def _matches_existing_contact(existing, phone_number, personal_email, google_email):
    submitted_phone = _digits(phone_number)
    existing_phone = _digits(existing.phone_number)
    if submitted_phone and existing_phone and submitted_phone == existing_phone:
        return True

    submitted_emails = {
        str(personal_email or '').strip().lower(),
        str(google_email or '').strip().lower(),
    }
    existing_personal = str(existing.personal_email or '').strip().lower()
    return bool(existing_personal and existing_personal in submitted_emails)


def _digits(value):
    return re.sub(r'\D+', '', str(value or ''))
