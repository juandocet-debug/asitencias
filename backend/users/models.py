from django.contrib.auth.models import AbstractUser
from django.db import models
from cloudinary.models import CloudinaryField
import uuid
from django.utils import timezone
from datetime import timedelta


# ════════════════════════════════════════════════════════════════
# CATÁLOGOS ACADÉMICOS
# ════════════════════════════════════════════════════════════════

class Faculty(models.Model):
    """Facultad académica (ej. Educación Física)."""
    name = models.CharField(max_length=200, verbose_name="Nombre")
    code = models.CharField(max_length=20, unique=True, verbose_name="Código")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Facultad"
        verbose_name_plural = "Facultades"
        ordering = ['name']

    def __str__(self):
        return self.name


class Program(models.Model):
    """Programa académico (ej. Licenciatura en Recreación)."""
    name = models.CharField(max_length=200, verbose_name="Nombre")
    faculty = models.ForeignKey(
        Faculty, on_delete=models.CASCADE,
        related_name='programs', verbose_name="Facultad"
    )
    code = models.CharField(max_length=20, unique=True, verbose_name="Código")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Programa"
        verbose_name_plural = "Programas"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} — {self.faculty.name}"


# ════════════════════════════════════════════════════════════════
# USUARIO
# ════════════════════════════════════════════════════════════════

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrador'),
        ('COORDINATOR', 'Coordinador'),
        ('TEACHER', 'Docente'),
        ('STUDENT', 'Estudiante'),
        ('PRACTICE_TEACHER', 'Profesor de Práctica'),  # Docente asignado a una práctica
    )

    # Rol principal — usado por ILINYX y como rol "activo" por defecto
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')

    # Multi-rol: un usuario puede ser TEACHER + COORDINATOR a la vez
    # Almacena la lista de TODOS sus roles, ej: ["TEACHER", "COORDINATOR"]
    roles = models.JSONField(
        default=list, blank=True,
        verbose_name="Roles activos",
        help_text="Lista de todos los roles del usuario"
    )

    # Afiliación académica
    faculty = models.ForeignKey(
        Faculty, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='users', verbose_name="Facultad"
    )
    program = models.ForeignKey(
        Program, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='users', verbose_name="Programa"
    )

    # Campos adicionales perfil
    document_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    second_name = models.CharField(max_length=150, blank=True)
    second_lastname = models.CharField(max_length=150, blank=True)
    personal_email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    photo = CloudinaryField('image', blank=True, null=True, folder='profile_photos')

    def save(self, *args, **kwargs):
        # Sincronizar: si roles está vacío, inicializar con el rol principal
        if not self.roles:
            self.roles = [self.role] if self.role else ['STUDENT']
        # Asegurar que el rol principal siempre esté en la lista de roles
        if self.role and self.role not in self.roles:
            self.roles.append(self.role)
        super().save(*args, **kwargs)

    @property
    def is_coordinator(self):
        return 'COORDINATOR' in (self.roles or [])

    @property
    def coordinator_types(self):
        """Devuelve la lista de tipos de coordinación del usuario."""
        return list(self.coordinator_profiles.values_list('coordinator_type', flat=True))

    def __str__(self):
        return f"{self.username} - {self.get_full_name()}"


# ════════════════════════════════════════════════════════════════
# PERFIL DE COORDINADOR
# ════════════════════════════════════════════════════════════════

class CoordinatorProfile(models.Model):
    """
    Asignación de coordinación. Un usuario (generalmente TEACHER) puede tener
    varias coordinaciones, pero cada coordinación está ligada a un programa.
    """
    COORDINATOR_TYPE_CHOICES = [
        ('PRACTICAS', 'Prácticas'),
        ('PROGRAMA', 'Programa'),
        ('INVESTIGACION', 'Investigación'),
        ('EXTENSION', 'Extensión'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='coordinator_profiles',
        verbose_name="Usuario"
    )
    coordinator_type = models.CharField(
        max_length=20, choices=COORDINATOR_TYPE_CHOICES,
        verbose_name="Tipo de coordinación"
    )
    program = models.ForeignKey(
        Program, on_delete=models.CASCADE,
        related_name='coordinators',
        verbose_name="Programa"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'coordinator_type', 'program')
        verbose_name = "Perfil de Coordinador"
        verbose_name_plural = "Perfiles de Coordinador"

    def __str__(self):
        return f"{self.user.get_full_name()} — {self.get_coordinator_type_display()} — {self.program.name}"


# ════════════════════════════════════════════════════════════════
# PASSWORD RESET
# ════════════════════════════════════════════════════════════════

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at

    def __str__(self):
        return f"Reset token for {self.user.username}"
