from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = 'Crea un superusuario automáticamente si no existe (usando variables de entorno)'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # 1. ADMIN PRINCIPAL
        username = os.environ.get('ADMIN_USERNAME', 'admin')
        email = os.environ.get('ADMIN_EMAIL', 'admin@admin.com')
        password = os.environ.get('ADMIN_PASSWORD', 'Admin123*')

        test_users = [
            {'username': 'juandocet@gmail.com', 'email': 'juandocet@gmail.com', 'password': 'Admin123*', 'role': 'ADMIN', 'is_staff': True, 'is_superuser': True, 'first_name': 'Juan', 'last_name': 'Admin'},
            {'username': 'jdrara@upn.edu.co', 'email': 'jdrara@upn.edu.co', 'password': 'Teacher123*', 'role': 'TEACHER', 'is_staff': False, 'is_superuser': False, 'first_name': 'Juan', 'last_name': 'Docente', 'document_number': '123213123'},
            {'username': 'AS@GMAIL.COM', 'email': 'AS@GMAIL.COM', 'password': 'Student123*', 'role': 'STUDENT', 'is_staff': False, 'is_superuser': False, 'first_name': 'Ana', 'last_name': 'Estudiante', 'document_number': '12123'},
        ]

        # También asegurar el usuario 'admin' base de las variables de entorno si es diferente
        if not any(u['username'] == username for u in test_users):
             test_users.append({'username': username, 'email': email, 'password': password, 'role': 'ADMIN', 'is_staff': True, 'is_superuser': True, 'first_name': 'Super', 'last_name': 'User'})

        for u_data in test_users:
            uname = u_data.pop('username')
            pwd = u_data.pop('password')
            
            user, created = User.objects.get_or_create(username=uname, defaults=u_data)
            
            # Forzar actualización de datos sensibles para asegurar el rol y acceso
            user.set_password(pwd)
            for key, value in u_data.items():
                setattr(user, key, value)
            user.save()
            
            status_text = "creado" if created else "actualizado y sincronizado"
            self.stdout.write(self.style.SUCCESS(f'✅ Usuario {uname} {status_text} (Rol: {user.role})'))
