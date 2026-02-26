from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from rest_framework.filters import SearchFilter
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .serializers import (
    StudentRegisterSerializer, UserSerializer, UserProfileSerializer,
    AdminUserCreateSerializer, AdminUserUpdateSerializer,
    FacultySerializer, ProgramSerializer, CoordinatorProfileSerializer,
)
from .models import PasswordResetToken, Faculty, Program, CoordinatorProfile
from rest_framework.decorators import action
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Reemplaza el TokenObtainPairView por defecto para usar nuestro
    DocumentNumberBackend. Acepta cédula, email o username como identificador.
    """
    def post(self, request, *args, **kwargs):
        identifier = request.data.get('username', '').strip()
        password   = request.data.get('password', '')

        if not identifier or not password:
            return Response(
                {'detail': 'Ingresa tu usuario y contraseña.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # django.contrib.auth.authenticate recorre AUTHENTICATION_BACKENDS en orden
        # → primero DocumentNumberBackend (por cédula), luego ModelBackend (por username/email)
        user = authenticate(request, username=identifier, password=password)

        if user is None:
            return Response(
                {'detail': 'Credenciales inválidas. Verifique su usuario y contraseña.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'Esta cuenta está desactivada.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        })


class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD de usuarios para el ADMIN.
    Usa diferentes serializers según la operación para manejar correctamente
    el hasheo de contraseñas y la validación de campos.
    Soporta ?search=término para buscar por nombre, apellido o cédula.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['first_name', 'last_name', 'username', 'email']

    def get_serializer_class(self):
        """Seleccionar serializer según la acción."""
        if self.action == 'create':
            return AdminUserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        search = self.request.query_params.get('search', '').strip()

        # Base queryset según rol
        if user.role == 'ADMIN' or user.is_superuser:
            qs = User.objects.all()
        elif user.role == 'TEACHER':
            from academic.models import Course
            student_ids = Course.objects.filter(teacher=user).values_list('students__id', flat=True).distinct()
            qs = User.objects.filter(id__in=student_ids)
        else:
            qs = User.objects.none()

        # Filtro de búsqueda manual (además de SearchFilter)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(username__icontains=search) |
                Q(email__icontains=search)
            )

        return qs.order_by('first_name', 'last_name')

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


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # La autenticación es via API key en el header
def search_all_users(request):
    """
    Busca usuarios de AGON para el autocomplete de ILINYX.
    Requiere header  X-Ilinyx-Api-Key: <ILINYX_API_KEY>
    Solo debe ser llamado desde el BACKEND de ILINYX, nunca desde el browser.
    ?q=término  → filtra por nombre/apellido/cédula/email
    """
    from django.conf import settings
    expected_key = getattr(settings, 'ILINYX_API_KEY', None)
    received_key = request.headers.get('X-Ilinyx-Api-Key', '')

    if not expected_key or received_key != expected_key:
        return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    q = request.query_params.get('q', '').strip()
    if len(q) < 2:
        return Response([])

    qs = User.objects.filter(
        Q(first_name__icontains=q) |
        Q(last_name__icontains=q) |
        Q(username__icontains=q) |
        Q(email__icontains=q)
    ).order_by('first_name', 'last_name')[:20]

    from .serializers import UserSerializer
    return Response(UserSerializer(qs, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Autenticación via API key
def list_courses_for_ilinyx(request):
    """
    Lista las clases de AGON con sus estudiantes para que ILINYX pueda
    importar clases completas al crear actas (carga masiva de asistentes).
    Requiere header X-Ilinyx-Api-Key.
    Solo debe ser llamado desde el BACKEND de ILINYX, nunca desde el browser.
    """
    from django.conf import settings
    from academic.models import Course

    expected_key = getattr(settings, 'ILINYX_API_KEY', None)
    received_key = request.headers.get('X-Ilinyx-Api-Key', '')

    if not expected_key or received_key != expected_key:
        return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    courses = Course.objects.all().prefetch_related('students').select_related('teacher')

    result = []
    for course in courses:
        students = []
        for s in course.students.all():
            students.append({
                'id': s.id,
                'first_name': s.first_name,
                'last_name': s.last_name,
                'email': s.email,
                'role': s.role,
                'document_number': s.document_number,
                'photo': s.photo.url if s.photo else None,
            })

        result.append({
            'id': course.id,
            'name': course.name,
            'code': course.code,
            'year': course.year,
            'period': course.period,
            'teacher_name': f'{course.teacher.first_name} {course.teacher.last_name}'.strip(),
            'teacher_id': course.teacher.id,
            'student_count': len(students),
            'students': students,
        })

    return Response(result)


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


# ════════════════════════════════════════════════════════════════
# CATÁLOGOS — Facultades, Programas, Tipos de Coordinador
# (lectura para cualquier autenticado, escritura solo ADMIN)
# ════════════════════════════════════════════════════════════════

class IsAdminOrReadOnly(permissions.BasePermission):
    """Permite lectura a cualquier autenticado, escritura solo a ADMIN."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and (request.user.role == 'ADMIN' or request.user.is_superuser)


class FacultyViewSet(viewsets.ModelViewSet):
    """CRUD de facultades. Lectura: todos. Escritura: solo ADMIN."""
    queryset = Faculty.objects.all().order_by('name')
    serializer_class = FacultySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]


class ProgramViewSet(viewsets.ModelViewSet):
    """CRUD de programas. Lectura: todos. Escritura: solo ADMIN. Soporta ?faculty=id."""
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Program.objects.select_related('faculty').all().order_by('name')
        faculty_id = self.request.query_params.get('faculty')
        if faculty_id:
            qs = qs.filter(faculty_id=faculty_id)
        return qs


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def coordinator_types(request):
    """Devuelve la lista de tipos de coordinación disponibles."""
    return Response(CoordinatorProfile.COORDINATOR_TYPE_CHOICES)
