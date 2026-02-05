from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = 'Crea un superusuario automáticamente si no existe (usando variables de entorno)'

    def handle(self, *args, **options):
        User = get_user_model()
        # Valores por defecto o tomados de variables de entorno de Render
        username = os.environ.get('ADMIN_USERNAME', 'admin')
        email = os.environ.get('ADMIN_EMAIL', 'admin@admin.com')
        password = os.environ.get('ADMIN_PASSWORD', 'admin123')

        if not User.objects.filter(username=username).exists():
            print(f"Creando superusuario: {username}...")
            User.objects.create_superuser(
                username=username, 
                email=email, 
                password=password,
                role='ADMIN',  # ASIGNA ROL ADMINISTRADOR
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(self.style.SUCCESS(f'✅ ¡Superusuario "{username}" creado exitosamente con rol ADMIN!'))
        else:
            # Si ya existe, aseguramos que tenga el rol correcto
            user = User.objects.get(username=username)
            if user.role != 'ADMIN' or not user.is_superuser:
                user.role = 'ADMIN'
                user.is_staff = True
                user.is_superuser = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f'🔄 Usuario "{username}" actualizado a ADMIN y Superuser.'))
            else:
                self.stdout.write(self.style.SUCCESS(f'ℹ️ El superusuario "{username}" ya existe y está configurado correctamente.'))
