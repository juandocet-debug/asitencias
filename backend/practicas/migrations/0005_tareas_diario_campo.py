# Generated migration — UPN CIAR / AGON
# 1. Añade campo 'horas' (DecimalField) a ReflexionEstudiante (Diario de Campo)
# 2. Crea modelos TareaPractica, EntregaTarea, EvidenciaEntrega
# Se aplica en Postgres (Render) vía build.sh → manage.py migrate

import cloudinary.models
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('practicas', '0004_reflexionestudiante_imagen'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── campo horas en DiarioDeCampo (ReflexionEstudiante) ──
        migrations.AddField(
            model_name='reflexionestudiante',
            name='horas',
            field=models.DecimalField(
                decimal_places=1, default=0, max_digits=5,
                help_text='Horas que el estudiante dedicó en esta sesión',
                verbose_name='Horas dedicadas',
            ),
        ),

        # ── verbose_name update ──
        migrations.AlterModelOptions(
            name='reflexionestudiante',
            options={
                'ordering': ['-seguimiento__date'],
                'verbose_name': 'Diario de Campo',
                'verbose_name_plural': 'Diarios de Campo',
            },
        ),

        # ── TareaPractica ──
        migrations.CreateModel(
            name='TareaPractica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=300, verbose_name='Título')),
                ('descripcion', models.TextField(blank=True, verbose_name='Descripción / instrucciones')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('practica', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='tareas',
                    to='practicas.practica',
                    verbose_name='Práctica',
                )),
                ('created_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='tareas_creadas',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Creado por',
                )),
            ],
            options={
                'verbose_name': 'Tarea de Práctica',
                'verbose_name_plural': 'Tareas de Práctica',
                'ordering': ['-created_at'],
            },
        ),

        # ── EntregaTarea ──
        migrations.CreateModel(
            name='EntregaTarea',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('propuesta', models.TextField(verbose_name='Propuesta / descripción del trabajo')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tarea', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='entregas',
                    to='practicas.tareapractica',
                    verbose_name='Tarea',
                )),
                ('student', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='entregas_practica',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Estudiante',
                )),
            ],
            options={
                'verbose_name': 'Entrega de Tarea',
                'verbose_name_plural': 'Entregas de Tareas',
                'ordering': ['-created_at'],
                'unique_together': {('tarea', 'student')},
            },
        ),

        # ── EvidenciaEntrega ──
        migrations.CreateModel(
            name='EvidenciaEntrega',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('archivo', cloudinary.models.CloudinaryField(
                    'evidencia_archivo',
                    help_text='Foto, PDF o documento de evidencia (va a Cloudinary)',
                )),
                ('descripcion', models.CharField(blank=True, max_length=300, verbose_name='Descripción del archivo')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('entrega', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='evidencias',
                    to='practicas.entregatarea',
                    verbose_name='Entrega',
                )),
            ],
            options={
                'verbose_name': 'Evidencia de Entrega',
                'verbose_name_plural': 'Evidencias de Entrega',
                'ordering': ['created_at'],
            },
        ),
    ]
