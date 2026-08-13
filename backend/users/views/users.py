# users/views/users.py
# CRUD de usuarios, registro de estudiantes, unirse a clase y catálogos
# (Facultades, Programas, Tipos de Coordinador).

from rest_framework import generics, permissions, status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.filters import SearchFilter
from django.contrib.auth import get_user_model
from django.db.models import Q
from ..serializers import (
    StudentRegisterSerializer, UserSerializer, UserProfileSerializer,
    AdminUserCreateSerializer, AdminUserUpdateSerializer,
    FacultySerializer, ProgramSerializer, CoordinatorProfileSerializer,
)
from ..models import Faculty, Program, CoordinatorProfile

User = get_user_model()


class UserPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD de usuarios para el ADMIN.
    Usa diferentes serializers según la operación para manejar correctamente
    el hasheo de contraseñas y la validación de campos.
    Soporta ?search=término para buscar por nombre, apellido, cédula o email.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = []
    search_fields = ['first_name', 'last_name', 'username', 'email']
    pagination_class = UserPagination

    def get_serializer_class(self):
        """Seleccionar serializer según la acción."""
        if self.action == 'create':
            return AdminUserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        return UserSerializer

    def _base_queryset(self):
        user = self.request.user
        user_roles = user.roles or [user.role]

        # Base queryset según rol del usuario logueado
        if 'ADMIN' in user_roles or user.is_superuser:
            qs = User.objects.all()
        elif 'TEACHER' in user_roles or 'PRACTICE_TEACHER' in user_roles:
            from academic.models import Course
            student_ids = Course.objects.filter(
                teacher=user
            ).values_list('students__id', flat=True).distinct()
            qs = User.objects.filter(id__in=student_ids)
        else:
            qs = User.objects.none()

        return qs

    def _stats_for(self, qs):
        return {
            'total': qs.count(),
            'students': qs.filter(role='STUDENT').count(),
            'teachers': qs.filter(role='TEACHER').count(),
            'coordinators': qs.filter(roles__contains=['COORDINATOR']).count(),
            'admins': qs.filter(role='ADMIN').count(),
        }

    def get_queryset(self):
        search = self.request.query_params.get('search', '').strip()
        role = self.request.query_params.get('role', '').strip()
        qs = self._base_queryset()

        # Filtro de búsqueda adicional
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(username__icontains=search)   |
                Q(email__icontains=search)      |
                Q(document_number__icontains=search)
            )

        if role and role != 'ALL':
            qs = qs.filter(
                Q(role=role) |
                Q(roles__contains=[role])
            )

        return (
            qs.select_related('faculty', 'program')
              .prefetch_related('coordinator_profiles__program')
              .only(
                  'id', 'username', 'first_name', 'last_name', 'email', 'role',
                  'roles', 'document_number', 'second_name', 'second_lastname',
                  'personal_email', 'phone_number', 'photo', 'faculty_id',
                  'program_id', 'is_directory_imported', 'requires_onboarding',
                  'directory_batch_id', 'faculty__name', 'program__name',
              )
              .order_by('first_name', 'last_name', 'id')
        )

    def list(self, request, *args, **kwargs):
        filtered_qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(filtered_qs)
        serializer = self.get_serializer(page, many=True)
        response = self.get_paginated_response(serializer.data)
        response.data['stats'] = self._stats_for(self._base_queryset())
        return response

    def create(self, request, *args, **kwargs):
        """Crear usuario — solo ADMIN."""
        user_roles = request.user.roles or [request.user.role]
        if 'ADMIN' not in user_roles and not request.user.is_superuser:
            return Response(
                {'error': 'Solo los administradores pueden crear usuarios.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """Actualizar usuario — solo ADMIN."""
        user_roles = request.user.roles or [request.user.role]
        if 'ADMIN' not in user_roles and not request.user.is_superuser:
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
        """Obtener o actualizar el perfil del usuario actualmente logueado."""
        user = request.user
        if request.method == 'GET':
            serializer = UserProfileSerializer(user, context={'request': request})
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = UserProfileSerializer(
                user, data=request.data, partial=True, context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentRegisterView(generics.CreateAPIView):
    """Registro público de estudiantes (sin autenticación previa)."""
    serializer_class   = StudentRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": {
                "username": user.username,
                "email":    user.email,
                "role":     user.role,
            },
            "message": "Estudiante registrado exitosamente"
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_class(request):
    """Permite a un estudiante ya registrado unirse a una clase usando un código."""
    class_code = request.data.get('class_code')

    if not class_code:
        return Response(
            {'error': 'El código de clase es requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    roles = request.user.roles or [request.user.role]
    if 'STUDENT' not in roles:
        return Response(
            {'error': 'Solo los estudiantes pueden unirse a clases'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        from academic.models import Course
        course = Course.objects.get(code__iexact=str(class_code).strip(), is_archived=False)
    except Course.DoesNotExist:
        return Response({'error': 'Código de clase inválido'}, status=status.HTTP_404_NOT_FOUND)

    if request.user in course.students.all():
        return Response({'error': 'Ya estás inscrito en esta clase'}, status=status.HTTP_400_BAD_REQUEST)

    course.students.add(request.user)
    return Response({
        'message': f'Te has unido exitosamente a {course.name}',
        'course':  {'id': course.id, 'name': course.name, 'code': course.code}
    }, status=status.HTTP_200_OK)


# ════════════════════════════════════════════════════════════════
# CATÁLOGOS — Facultades, Programas, Tipos de Coordinador
# Permiso IsAdminOrReadOnly importado desde core/permissions.py
# ════════════════════════════════════════════════════════════════

class PublicCatalogReadAdminWrite(permissions.BasePermission):
    """Permite leer catálogos sin sesión y escribirlos solo al admin."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not (user and user.is_authenticated):
            return False
        user_roles = user.roles or [user.role]
        return 'ADMIN' in user_roles or user.is_superuser


class FacultyViewSet(viewsets.ModelViewSet):
    """CRUD de facultades. Lectura pública para registro, escritura admin."""
    queryset           = Faculty.objects.all().order_by('name')
    serializer_class   = FacultySerializer
    permission_classes = [PublicCatalogReadAdminWrite]


class ProgramViewSet(viewsets.ModelViewSet):
    """CRUD de programas. Soporta ?faculty=id para filtrar por facultad."""
    serializer_class   = ProgramSerializer
    permission_classes = [PublicCatalogReadAdminWrite]

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
