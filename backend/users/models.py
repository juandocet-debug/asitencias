from django.contrib.auth.models import AbstractUser
from django.db import models
from cloudinary.models import CloudinaryField
import uuid
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrador'),
        ('TEACHER', 'Docente'),
        ('STUDENT', 'Estudiante'),
    )
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    
    # Campos adicionales perfil
    document_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    second_name = models.CharField(max_length=150, blank=True)
    second_lastname = models.CharField(max_length=150, blank=True)
    personal_email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    photo = CloudinaryField('image', blank=True, null=True, folder='profile_photos')

    def __str__(self):
        return f"{self.username} - {self.get_full_name()}"


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
