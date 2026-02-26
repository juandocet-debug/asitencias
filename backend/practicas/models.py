"""
Modelos del módulo de Prácticas — UPN CIAR / AGON
==================================================
"""

import random
import string
from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField


def generate_practica_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


# ════════════════════════════════════════════════════════════════
# CATÁLOGOS REUTILIZABLES
# ════════════════════════════════════════════════════════════════

class SitioPractica(models.Model):
    """
    Lugar físico donde se realiza la práctica.
    Reutilizable: el coordinador los crea una vez y los asigna a múltiples prácticas.
    """
    name          = models.CharField(max_length=200, verbose_name='Nombre del sitio')
    address       = models.CharField(max_length=300, blank=True, verbose_name='Dirección')
    description   = models.TextField(blank=True, verbose_name='Descripción')
    # Contacto del sitio
    contact_name  = models.CharField(max_length=200, blank=True, verbose_name='Persona de contacto')
    phone_fixed   = models.CharField(max_length=20, blank=True, verbose_name='Teléfono fijo')
    phone_mobile  = models.CharField(max_length=20, blank=True, verbose_name='Celular')
    program       = models.ForeignKey(
        'users.Program',
        on_delete=models.CASCADE,
        related_name='sitios_practica',
        verbose_name='Programa'
    )
    is_active     = models.BooleanField(default=True, verbose_name='Activo')
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sitio de Práctica'
        verbose_name_plural = 'Sitios de Práctica'
        ordering = ['name']
        unique_together = ('name', 'program')

    def __str__(self):
        return f'{self.name} — {self.program.name}'


class ObjetivoPractica(models.Model):
    """Objetivo pedagógico reutilizable, scoped por programa."""
    name        = models.CharField(max_length=300, verbose_name='Objetivo')
    description = models.TextField(blank=True, verbose_name='Descripción ampliada')
    program     = models.ForeignKey(
        'users.Program',
        on_delete=models.CASCADE,
        related_name='objetivos_practica',
        verbose_name='Programa'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Objetivo de Práctica'
        verbose_name_plural = 'Objetivos de Práctica'
        ordering = ['name']

    def __str__(self):
        return self.name


# ════════════════════════════════════════════════════════════════
# PRÁCTICA ACADÉMICA
# ════════════════════════════════════════════════════════════════

class Practica(models.Model):
    PERIOD_CHOICES = (
        (1, 'Primer semestre'),
        (2, 'Segundo semestre'),
    )

    name                = models.CharField(max_length=200, verbose_name='Nombre de la práctica')
    program             = models.ForeignKey(
        'users.Program', on_delete=models.CASCADE,
        related_name='practicas', verbose_name='Programa'
    )
    coordinator         = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='practicas_coordinadas', verbose_name='Coordinador'
    )
    profesor_practica   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='practicas_asignadas', verbose_name='Profesor de Práctica'
    )
    sitios              = models.ManyToManyField(
        SitioPractica, blank=True, related_name='practicas', verbose_name='Sitios de práctica'
    )
    objetivos           = models.ManyToManyField(
        ObjetivoPractica, blank=True, related_name='practicas', verbose_name='Objetivos'
    )
    year                = models.IntegerField(default=2026, verbose_name='Año')
    period              = models.IntegerField(choices=PERIOD_CHOICES, default=1, verbose_name='Semestre')
    code                = models.CharField(
        max_length=8, unique=True, default=generate_practica_code,
        verbose_name='Código de inscripción'
    )
    students            = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name='practicas_inscritas',
        blank=True, verbose_name='Estudiantes inscritos'
    )
    is_active           = models.BooleanField(default=True, verbose_name='Activa')
    created_at          = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Práctica'
        verbose_name_plural = 'Prácticas'
        ordering = ['-year', '-period', 'name']

    def __str__(self):
        return f'{self.name} — {self.program.name} ({self.year}-{self.period})'


# ════════════════════════════════════════════════════════════════
# SEGUIMIENTO DE PRÁCTICA
# ════════════════════════════════════════════════════════════════

class SeguimientoPractica(models.Model):
    """
    Visita / sesión de seguimiento a una práctica.
    El coordinador o profesor registra la visita, toma asistencia y escribe novedades.
    """
    practica    = models.ForeignKey(
        Practica, on_delete=models.CASCADE,
        related_name='seguimientos', verbose_name='Práctica'
    )
    sitio       = models.ForeignKey(
        SitioPractica, on_delete=models.SET_NULL, null=True, blank=True,
        verbose_name='Sitio visitado'
    )
    date        = models.DateField(verbose_name='Fecha de visita')
    topic       = models.CharField(max_length=300, blank=True, verbose_name='Tema / actividad')
    novedades   = models.TextField(blank=True, verbose_name='Novedades')
    created_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='seguimientos_creados', verbose_name='Registrado por'
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Seguimiento de Práctica'
        verbose_name_plural = 'Seguimientos de Práctica'
        ordering = ['-date']

    def __str__(self):
        return f'{self.practica} — {self.date}'


class AsistenciaPractica(models.Model):
    """Registro de asistencia de un estudiante en una sesión de seguimiento."""
    STATUS_CHOICES = (
        ('PRESENT', 'Presente'),
        ('ABSENT',  'Ausente'),
        ('LATE',    'Tardanza'),
        ('EXCUSED', 'Excusado'),
    )

    seguimiento = models.ForeignKey(
        SeguimientoPractica, on_delete=models.CASCADE,
        related_name='asistencias', verbose_name='Seguimiento'
    )
    student     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        verbose_name='Estudiante'
    )
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PRESENT')
    comment     = models.TextField(blank=True, verbose_name='Comentario del coordinador')

    class Meta:
        verbose_name        = 'Asistencia Práctica'
        verbose_name_plural = 'Asistencias Práctica'
        unique_together     = ('seguimiento', 'student')

    def __str__(self):
        return f'{self.student} — {self.seguimiento} — {self.status}'


class ReflexionEstudiante(models.Model):
    """
    Diario de campo del estudiante.

    En cada sesión de seguimiento, el estudiante registra:
      - actividades  : qué hizo en la práctica
      - reflexion    : reflexión pedagógica sobre su actuar
      - aprendizajes : qué aprendió / qué mejoraría

    Solo el estudiante propietario puede crear o editar su reflexión.
    El coordinador y el profesor de práctica pueden leerlas.
    """
    seguimiento          = models.ForeignKey(
        SeguimientoPractica, on_delete=models.CASCADE,
        related_name='reflexiones', verbose_name='Sesión de práctica'
    )
    student              = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='reflexiones_practica', verbose_name='Estudiante'
    )
    actividades          = models.TextField(verbose_name='Actividades realizadas')
    reflexion_pedagogica = models.TextField(blank=True, verbose_name='Reflexión pedagógica')
    aprendizajes         = models.TextField(blank=True, verbose_name='Aprendizajes y mejoras')
    imagen               = CloudinaryField(
        'imagen_evidencia',
        folder='practicas/evidencias',
        blank=True,
        null=True,
        help_text='Foto o evidencia de la sesión de práctica (va a Cloudinary)'
    )
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Reflexión de Estudiante'
        verbose_name_plural = 'Reflexiones de Estudiantes'
        unique_together     = ('seguimiento', 'student')
        ordering            = ['-seguimiento__date']

    def __str__(self):
        return f'Reflexión: {self.student} — {self.seguimiento.date}'
