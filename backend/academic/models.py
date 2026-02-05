import random
import string
from django.db import models
from django.conf import settings
from datetime import date

def generate_course_code():
    length = 6
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

class Course(models.Model):
    PERIOD_CHOICES = (
        (1, '1'),
        (2, '2'),
    )
    
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teaching_courses')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=8, unique=True, default=generate_course_code)
    year = models.IntegerField(default=2026)
    period = models.IntegerField(choices=PERIOD_CHOICES, default=1)
    start_date = models.DateField(default=date.today)
    end_date = models.DateField(default=date.today)
    students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='enrolled_courses', limit_choices_to={'role': 'STUDENT'}, blank=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Session(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    topic = models.CharField(max_length=200, blank=True)
    
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
    
    # Campos para excusas
    excuse_file = models.FileField(upload_to='excuses/', null=True, blank=True)
    excuse_note = models.TextField(blank=True, null=True)
    excuse_status = models.CharField(max_length=10, choices=EXCUSE_STATUS_CHOICES, null=True, blank=True)
    excuse_submitted_at = models.DateTimeField(null=True, blank=True)
    excuse_reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('session', 'student')
    
    def __str__(self):
        return f"{self.student} - {self.session} - {self.status}"

