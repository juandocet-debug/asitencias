import random
import string
from datetime import date

from django.conf import settings
from django.db import models
from django.utils import timezone


def generate_course_code():
    length = 6
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


class Course(models.Model):
    PERIOD_CHOICES = (
        (1, '1'),
        (2, '2'),
    )

    COLOR_CHOICES = (
        ('blue', 'Azul'),
        ('violet', 'Violeta'),
        ('emerald', 'Esmeralda'),
        ('amber', 'Ámbar'),
        ('rose', 'Rosa'),
        ('cyan', 'Cian'),
    )

    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teaching_courses')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=8, unique=True, default=generate_course_code)
    color = models.CharField(max_length=10, choices=COLOR_CHOICES, default='blue')
    year = models.IntegerField(default=2026)
    period = models.IntegerField(choices=PERIOD_CHOICES, default=1)
    start_date = models.DateField(default=date.today)
    end_date = models.DateField(default=date.today)
    students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='enrolled_courses', limit_choices_to={'role': 'STUDENT'}, blank=True)
    schedule = models.JSONField(default=list, blank=True)
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    def archive(self):
        if not self.is_archived:
            self.is_archived = True
            self.archived_at = timezone.now()
            self.save(update_fields=['is_archived', 'archived_at'])

    def restore(self):
        if self.is_archived:
            self.is_archived = False
            self.archived_at = None
            self.save(update_fields=['is_archived', 'archived_at'])

    def __str__(self):
        return f"{self.name} ({self.code})"


class Session(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    topic = models.CharField(max_length=200, blank=True)
    self_checkin_enabled = models.BooleanField(default=False)
    self_checkin_code = models.CharField(max_length=6, blank=True)
    self_checkin_opened_at = models.DateTimeField(null=True, blank=True)
    self_checkin_expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.course} - {self.date}"


class Attendance(models.Model):
    STATUS_CHOICES = (
        ('PRESENT', 'Presente'),
        ('LATE', 'Retardo'),
        ('ABSENT', 'Falta'),
        ('EXCUSED', 'Excusa'),
    )

    EXCUSE_STATUS_CHOICES = (
        ('PENDING', 'Pendiente'),
        ('APPROVED', 'Aprobada'),
        ('REJECTED', 'Rechazada'),
    )

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    excuse_file = models.FileField(upload_to='excuses/', null=True, blank=True)
    excuse_note = models.TextField(blank=True, null=True)
    excuse_status = models.CharField(max_length=10, choices=EXCUSE_STATUS_CHOICES, null=True, blank=True)
    excuse_submitted_at = models.DateTimeField(null=True, blank=True)
    excuse_reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student} - {self.session} - {self.status}"


class Mission(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='missions')
    name = models.CharField(max_length=120)
    hero_subtitle = models.CharField(max_length=200, blank=True, help_text="Subtítulo épico para la cabecera de la Campaña")
    description = models.TextField(blank=True)
    lore_text = models.TextField(blank=True, help_text="Historia / Lore de la Campaña")
    image = models.ImageField(upload_to='missions/', null=True, blank=True)
    hero_image = models.ImageField(upload_to='missions/hero/', null=True, blank=True, help_text="Imagen de portada estilo Fortnite/Gamer")
    group_size = models.PositiveSmallIntegerField(default=4)
    inventory_name = models.CharField(max_length=120, blank=True)
    inventory_description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f"{self.name} - {self.course}"


class MissionResource(models.Model):
    TYPE_CHOICES = (
        ('READING', 'Lectura'),
        ('YOUTUBE', 'YouTube'),
        ('LINK', 'Enlace'),
        ('FILE', 'Archivo'),
    )

    mission = models.ForeignKey(Mission, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=120)
    resource_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    url = models.URLField(blank=True)
    file = models.FileField(upload_to='mission_resources/', null=True, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ('order', 'id')

    def __str__(self):
        return f"{self.title} ({self.resource_type})"
