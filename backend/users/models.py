from django.contrib.auth.models import AbstractUser
from django.db import models
from cloudinary.models import CloudinaryField

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
