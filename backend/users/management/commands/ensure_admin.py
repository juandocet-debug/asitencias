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
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'✅ ¡Superusuario "{username}" creado exitosamente!'))
        else:
            self.stdout.write(self.style.SUCCESS(f'ℹ️ El superusuario "{username}" ya existe.'))
