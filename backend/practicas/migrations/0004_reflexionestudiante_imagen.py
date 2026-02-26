# Generated migration — UPN CIAR / AGON
# Añade campo imagen (CloudinaryField nullable) a ReflexionEstudiante.
# Se aplica automáticamente en Postgres (Render) via build.sh → manage.py migrate.
# null=True garantiza compatibilidad con registros existentes.

import cloudinary.models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('practicas', '0003_alter_asistenciapractica_comment_reflexionestudiante'),
    ]

    operations = [
        migrations.AddField(
            model_name='reflexionestudiante',
            name='imagen',
            field=cloudinary.models.CloudinaryField(
                'imagen_evidencia',
                blank=True,
                null=True,
                help_text='Foto o evidencia de la sesión de práctica (va a Cloudinary)',
            ),
        ),
    ]
