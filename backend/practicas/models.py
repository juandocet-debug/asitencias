"""
Modelos del módulo de Prácticas — UPN CIAR / AGON
==================================================

Arquitectura:
  SitioPractica  → lugar físico donde se realiza la práctica (reutilizable por programa)
  ObjetivoPractica → objetivo genérico reutilizable que se puede asignar a varias prácticas
  Practica       → práctica académica asignada por el Coordinador de Prácticas
  InscripcionPractica → relación Estudiante ↔ Practica (con código QR, igual que Course)

Reglas de negocio:
  - Un Coordinador de Prácticas solo puede crear/ver prácticas de su propio programa
  - Un ProfesorPractica es asignado a una práctica; no puede crear clases
  - Los estudiantes se unen a una práctica via código QR (igual que Course)
  - Sitios y Objetivos son reutilizables dentro del mismo programa
"""

import random
import string
from django.db import models
from django.conf import settings


def generate_practica_code():
    """Genera un código único de 6 caracteres para unirse vía QR."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


# ════════════════════════════════════════════════════════════════
# CATÁLOGOS REUTILIZABLES
# ════════════════════════════════════════════════════════════════

class SitioPractica(models.Model):
    """
    Lugar físico donde se realiza la práctica.
    Reutilizable: el coordinador los crea una vez y los asigna a múltiples prácticas.
    Scoped por programa para que cada programa tenga sus propios sitios.
    """
    name        = models.CharField(max_length=200, verbose_name='Nombre del sitio')
    address     = models.CharField(max_length=300, blank=True, verbose_name='Dirección')
    description = models.TextField(blank=True, verbose_name='Descripción')
    program     = models.ForeignKey(
        'users.Program',
        on_delete=models.CASCADE,
        related_name='sitios_practica',
        verbose_name='Programa'
    )
    is_active   = models.BooleanField(default=True, verbose_name='Activo')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sitio de Práctica'
        verbose_name_plural = 'Sitios de Práctica'
        ordering = ['name']
        unique_together = ('name', 'program')

    def __str__(self):
        return f'{self.name} — {self.program.name}'


class ObjetivoPractica(models.Model):
    """
    Objetivo pedagógico de la práctica.
    Reutilizable: el coordinador los define y los asigna a múltiples prácticas.
    Scoped por programa.
    """
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
    """
    Práctica académica (asignatura práctica).

    - Creada y gestionada por el Coordinador de Prácticas de un programa.
    - Asignada a un ProfesorPractica (role=PRACTICE_TEACHER).
    - Los estudiantes se inscriben vía código QR o asignación directa.
    - Reutiliza SitioPractica y ObjetivoPractica del mismo programa.
    """
    PERIOD_CHOICES = (
        (1, 'Primer semestre'),
        (2, 'Segundo semestre'),
    )

    name                = models.CharField(max_length=200, verbose_name='Nombre de la práctica')
    program             = models.ForeignKey(
        'users.Program',
        on_delete=models.CASCADE,
        related_name='practicas',
        verbose_name='Programa'
    )
    coordinator         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='practicas_coordinadas',
        verbose_name='Coordinador'
    )
    profesor_practica   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='practicas_asignadas',
        verbose_name='Profesor de Práctica'
    )
    sitios              = models.ManyToManyField(
        SitioPractica,
        blank=True,
        related_name='practicas',
        verbose_name='Sitios de práctica'
    )
    objetivos           = models.ManyToManyField(
        ObjetivoPractica,
        blank=True,
        related_name='practicas',
        verbose_name='Objetivos'
    )
    year                = models.IntegerField(default=2026, verbose_name='Año')
    period              = models.IntegerField(choices=PERIOD_CHOICES, default=1, verbose_name='Semestre')
    code                = models.CharField(
        max_length=8, unique=True, default=generate_practica_code,
        verbose_name='Código QR'
    )
    students            = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='practicas_inscritas',
        blank=True,
        verbose_name='Estudiantes inscritos'
    )
    is_active           = models.BooleanField(default=True, verbose_name='Activa')
    created_at          = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Práctica'
        verbose_name_plural = 'Prácticas'
        ordering = ['-year', '-period', 'name']

    def __str__(self):
        return f'{self.name} — {self.program.name} ({self.year}-{self.period})'
