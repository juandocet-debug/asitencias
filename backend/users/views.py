from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from .serializers import (
    StudentRegisterSerializer, UserSerializer, UserProfileSerializer,
    AdminUserCreateSerializer, AdminUserUpdateSerializer
)
from rest_framework.decorators import action
from .models import PasswordResetToken
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD de usuarios para el ADMIN.
    Usa diferentes serializers según la operación para manejar correctamente
    el hasheo de contraseñas y la validación de campos.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Seleccionar serializer según la acción."""
        if self.action == 'create':
            return AdminUserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user

        # 1. ADMIN ve TODO
        if user.role == 'ADMIN' or user.is_superuser:
            return User.objects.all().order_by('-date_joined')

        # 2. TEACHER ve solo sus ESTUDIANTES
        if user.role == 'TEACHER':
            from academic.models import Course
            student_ids = Course.objects.filter(teacher=user).values_list('students__id', flat=True).distinct()
            return User.objects.filter(id__in=student_ids).order_by('-date_joined')

        # 3. STUDENT no ve a nadie
        return User.objects.none()

    def create(self, request, *args, **kwargs):
        """Crear usuario — solo ADMIN."""
        if request.user.role != 'ADMIN' and not request.user.is_superuser:
            return Response(
                {'error': 'Solo los administradores pueden crear usuarios.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        # Devolver errores detallados para que el frontend los muestre
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """Actualizar usuario — solo ADMIN."""
        if request.user.role != 'ADMIN' and not request.user.is_superuser:
            return Response(
                {'error': 'Solo los administradores pueden editar usuarios.'},
                status=status.HTTP_403_FORBIDDEN
            )
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """
        Endpoint simple para obtener o actualizar el perfil del usuario logueado.
        No requiere pasar ID en la URL.
        """
        user = request.user
        if request.method == 'GET':
            serializer = UserProfileSerializer(user, context={'request': request})
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            serializer = UserProfileSerializer(user, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 

class StudentRegisterView(generics.CreateAPIView):
    serializer_class = StudentRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role
            },
            "message": "Estudiante registrado exitosamente"
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """
    Solicita un reset de contraseña. Envía un email al correo personal del usuario.
    """
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'El correo es requerido'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(personal_email=email)
    except User.DoesNotExist:
        return Response({'error': 'No existe un usuario con ese correo personal'}, status=status.HTTP_404_NOT_FOUND)
    
    # Crear token de reset
    reset_token = PasswordResetToken.objects.create(user=user)
    
    # Construir URL de reset
    frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:5173'
    reset_url = f"{frontend_url}/reset-password?token={reset_token.token}"
    
    # Enviar email
    try:
        send_mail(
            subject='Recuperación de Contraseña - UPN',
            message=f'''
Hola {user.first_name},

Has solicitado recuperar tu contraseña para el Sistema de Gestión Académica de la UPN.

Para establecer una nueva contraseña, haz clic en el siguiente enlace:
{reset_url}

Este enlace expirará en 24 horas.

Si no solicitaste este cambio, puedes ignorar este correo.

Saludos,
Sistema de Gestión Académica
Universidad Pedagógica Nacional
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@upn.edu.co',
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': 'Correo de recuperación enviado exitosamente'}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error sending email: {e}")
        return Response({'error': 'Error al enviar el correo. Intenta nuevamente.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """
    Confirma el reset de contraseña usando el token.
    """
    token = request.data.get('token')
    password = request.data.get('password')
    
    if not token or not password:
        return Response({'error': 'Token y contraseña son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Token inválido'}, status=status.HTTP_404_NOT_FOUND)
    
    if not reset_token.is_valid():
        return Response({'error': 'El token ha expirado o ya fue usado'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Cambiar contraseña
    user = reset_token.user
    user.set_password(password)
    user.save()
    
    # Marcar token como usado
    reset_token.used = True
    reset_token.save()
    
    return Response({'message': 'Contraseña actualizada exitosamente'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_class(request):
    """
    Permite a un estudiante ya registrado unirse a una clase usando un código.
    """
    class_code = request.data.get('class_code')
    
    if not class_code:
        return Response({'error': 'El código de clase es requerido'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verificar que el usuario sea estudiante
    if request.user.role != 'STUDENT':
        return Response({'error': 'Solo los estudiantes pueden unirse a clases'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from academic.models import Course
        course = Course.objects.get(code=class_code)
    except Course.DoesNotExist:
        return Response({'error': 'Código de clase inválido'}, status=status.HTTP_404_NOT_FOUND)
    
    # Verificar si ya está inscrito
    if request.user in course.students.all():
        return Response({'error': 'Ya estás inscrito en esta clase'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Agregar estudiante al curso
    course.students.add(request.user)
    
    return Response({
        'message': f'Te has unido exitosamente a {course.name}',
        'course': {
            'id': course.id,
            'name': course.name,
            'code': course.code
        }
    }, status=status.HTTP_200_OK)
