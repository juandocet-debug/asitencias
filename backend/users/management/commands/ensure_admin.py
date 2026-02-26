from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = 'Crea superusuario y cuentas de prueba SOLO si no existen — nunca sobrescribe datos en producción'

    def handle(self, *args, **options):
        User = get_user_model()

        # ── Variables de entorno para el admin principal ──────────────────────
        username = os.environ.get('ADMIN_USERNAME', 'juandocet@gmail.com')
        email    = os.environ.get('ADMIN_EMAIL',    'juandocet@gmail.com')
        password = os.environ.get('ADMIN_PASSWORD', 'Admin123*')

        seed_users = [
            {
                'username': username,
                'email':    email,
                'password': password,
                'defaults': {
                    'role': 'ADMIN', 'is_staff': True, 'is_superuser': True,
                    'first_name': 'Juan', 'last_name': 'Admin',
                    'document_number': os.environ.get('ADMIN_DOC', ''),
                },
            },
            {
                'username': 'jdrara@upn.edu.co',
                'email':    'jdrara@upn.edu.co',
                'password': 'Teacher123*',
                'defaults': {
                    'role': 'TEACHER', 'is_staff': False, 'is_superuser': False,
                    'first_name': 'Juan', 'last_name': 'Docente',
                    'document_number': '123213123',
                },
            },
            {
                'username': 'AS@GMAIL.COM',
                'email':    'AS@GMAIL.COM',
                'password': 'Student123*',
                'defaults': {
                    'role': 'STUDENT', 'is_staff': False, 'is_superuser': False,
                    'first_name': 'Ana', 'last_name': 'Estudiante',
                    'document_number': '12123',
                },
            },
        ]

        for entry in seed_users:
            uname    = entry['username']
            pwd      = entry['password']
            defaults = entry['defaults']

            # get_or_create: si YA existe en producción → NO tocar nada
            user, created = User.objects.get_or_create(
                username=uname,
                defaults={**defaults, 'email': entry['email']},
            )

            if created:
                # Solo al crear por primera vez: asignar contraseña inicial
                user.set_password(pwd)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'✅ Creado: {uname}'))
            else:
                # Ya existe → NO tocar su clave ni sus datos de producción
                self.stdout.write(self.style.WARNING(f'⏭  Ya existe, sin cambios: {uname}'))
