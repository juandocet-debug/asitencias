from rest_framework import serializers
from django.core.validators import validate_email
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from academic.models import Course
from .models import Faculty, Program, CoordinatorProfile

User = get_user_model()


# ════════════════════════════════════════════════════════════════
# CATÁLOGOS
# ════════════════════════════════════════════════════════════════

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ('id', 'name', 'code')


class ProgramSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = Program
        fields = ('id', 'name', 'code', 'faculty', 'faculty_name')


class CoordinatorProfileSerializer(serializers.ModelSerializer):
    coordinator_type_display = serializers.CharField(
        source='get_coordinator_type_display', read_only=True
    )
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = CoordinatorProfile
        fields = ('id', 'coordinator_type', 'coordinator_type_display', 'program', 'program_name')


# ════════════════════════════════════════════════════════════════
# USUARIOS
# ════════════════════════════════════════════════════════════════

class UserSerializer(serializers.ModelSerializer):
    """Serializer de solo lectura para listar usuarios."""
    coordinator_profiles = CoordinatorProfileSerializer(many=True, read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True, default=None)
    program_name = serializers.CharField(source='program.name', read_only=True, default=None)
    google_connected = serializers.SerializerMethodField()
    # SerializerMethodField evita que DRF serialice el CloudinaryField directamente
    # (que llamaría .url sin try/except). get_photo maneja todos los casos con seguridad.
    photo = serializers.SerializerMethodField()

    def get_photo(self, instance):
        if not instance.photo:
            return None
        try:
            return instance.photo.url
        except Exception:
            return None

    def get_google_connected(self, instance):
        return bool(instance.google_sub)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'first_name', 'last_name', 'email', 'role', 'roles',
            'document_number', 'second_name', 'second_lastname',
            'personal_email', 'google_email', 'phone_number', 'photo',
            'is_directory_imported', 'requires_onboarding',
            'google_connected',
            'faculty', 'faculty_name', 'program', 'program_name',
            'coordinator_profiles',
        )


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para que el ADMIN cree usuarios (cualquier rol).
    Maneja correctamente el hasheo de contraseña con set_password().
    """
    password = serializers.CharField(write_only=True, required=True)
    coordinator_profiles = CoordinatorProfileSerializer(many=True, required=False)

    class Meta:
        model = User
        fields = (
            'username', 'password', 'first_name', 'last_name', 'email',
            'role', 'roles', 'document_number', 'second_name', 'second_lastname',
            'personal_email', 'phone_number',
            'faculty', 'program',
            'coordinator_profiles',
        )

    def validate_password(self, value):
        """Validar la contraseña con las reglas de Django."""
        validate_password(value)
        return value

    def validate_username(self, value):
        """Si no se da username explícito, usamos el email como username."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con ese nombre de usuario.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con ese correo electrónico.")
        return value

    def validate_document_number(self, value):
        if value and User.objects.filter(document_number=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con ese número de documento.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        coordinator_data = validated_data.pop('coordinator_profiles', [])

        # Si no viene username, usarlo del email
        if not validated_data.get('username'):
            validated_data['username'] = validated_data.get('email', '')

        # Asegurar que roles incluya el rol principal
        roles = validated_data.get('roles', [])
        role = validated_data.get('role', 'STUDENT')
        if role not in roles:
            roles.append(role)
        validated_data['roles'] = roles

        # Crear con set_password para que el password sea hasheado
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Crear perfiles de coordinador si se proporcionaron
        for cp_data in coordinator_data:
            CoordinatorProfile.objects.create(user=user, **cp_data)

        return user

    def to_representation(self, instance):
        """Al devolver el usuario creado, usar el serializer estándar."""
        return UserSerializer(instance).data


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para que el ADMIN modifique usuarios existentes.
    La contraseña es opcional — si se envía, se hashea correctamente.
    """
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    coordinator_profiles = CoordinatorProfileSerializer(many=True, required=False)

    class Meta:
        model = User
        fields = (
            'username', 'password', 'first_name', 'last_name', 'email',
            'role', 'roles', 'document_number', 'second_name', 'second_lastname',
            'personal_email', 'phone_number',
            'faculty', 'program',
            'coordinator_profiles',
        )

    def validate_password(self, value):
        # El ADMIN puede asignar contraseñas sin restricciones de políticas Django
        # (ej: evitar error "contraseña demasiado común" al resetear credenciales)
        if value and len(value) < 6:
            raise serializers.ValidationError("La contraseña debe tener al menos 6 caracteres.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        coordinator_data = validated_data.pop('coordinator_profiles', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Solo actualizar contraseña si se proporcionó una
        if password:
            instance.set_password(password)

        instance.save()

        # Actualizar perfiles de coordinador solo si se enviaron
        if coordinator_data is not None:
            # Reemplazar: borrar los existentes y crear los nuevos
            instance.coordinator_profiles.all().delete()
            for cp_data in coordinator_data:
                CoordinatorProfile.objects.create(user=instance, **cp_data)

        return instance

    def to_representation(self, instance):
        return UserSerializer(instance).data


class StudentRegisterSerializer(serializers.ModelSerializer):
    """Serializer para auto-registro de estudiantes desde la página pública."""
    password = serializers.CharField(write_only=True)
    class_code = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'username', 'password', 'first_name', 'second_name', 'last_name',
            'second_lastname', 'email', 'personal_email', 'document_number',
            'phone_number', 'faculty', 'program', 'photo', 'class_code'
        )

    def validate_class_code(self, value):
        code = str(value or '').strip().upper()
        if not code:
            return ''
        if not Course.objects.filter(code__iexact=code, is_archived=False).exists():
            raise serializers.ValidationError('El código de clase no existe o ya no está activo.')
        return code

    def validate_document_number(self, value):
        document = str(value or '').strip()
        if not document:
            raise serializers.ValidationError('El número de documento es obligatorio.')
        if not document.isdigit():
            raise serializers.ValidationError('El documento debe contener solo números.')
        if User.objects.filter(document_number=document).exists():
            raise serializers.ValidationError('Este número de documento ya está registrado. Inicia sesión en lugar de crear una cuenta nueva.')
        return document

    def validate_email(self, value):
        email = str(value or '').strip().lower()
        if not email:
            raise serializers.ValidationError('El correo institucional es obligatorio.')
        try:
            validate_email(email)
        except Exception:
            raise serializers.ValidationError('Correo institucional inválido.')
        if not email.endswith('@upn.edu.co'):
            raise serializers.ValidationError('Usa tu correo institucional @upn.edu.co.')
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('Este correo institucional ya está registrado. Inicia sesión en lugar de crear una cuenta nueva.')
        return email

    def validate_username(self, value):
        username = str(value or '').strip().lower()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError('Este correo institucional ya está registrado. Inicia sesión en lugar de crear una cuenta nueva.')
        return username

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        attrs['email'] = email
        attrs['username'] = email
        return attrs

    def create(self, validated_data):
        class_code = validated_data.pop('class_code', None)
        password = validated_data.pop('password')

        # Forzar rol STUDENT
        validated_data['role'] = 'STUDENT'
        validated_data['roles'] = ['STUDENT']

        user = User.objects.create_user(password=password, **validated_data)

        if class_code:
            course = Course.objects.get(code__iexact=class_code, is_archived=False)
            course.students.add(user)

        return user

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Proteger la URL de la foto ante posibles fallos del campo Cloudinary
        if instance.photo:
            try:
                representation['photo'] = instance.photo.url
            except Exception:
                representation['photo'] = None
        return representation


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para que el usuario edite su propio perfil."""
    faculty_name = serializers.CharField(source='faculty.name', read_only=True, default=None)
    program_name = serializers.CharField(source='program.name', read_only=True, default=None)
    coordinator_profiles = CoordinatorProfileSerializer(many=True, read_only=True)
    # SerializerMethodField para leer la foto de forma segura (evita el error de CloudinaryField en local)
    photo = serializers.SerializerMethodField()
    google_connected = serializers.SerializerMethodField()

    def get_google_connected(self, instance):
        return bool(instance.google_sub)

    def get_photo(self, instance):
        if not instance.photo:
            return None
        try:
            request = self.context.get('request')
            url = instance.photo.url
            return request.build_absolute_uri(url) if request else url
        except Exception:
            return None

    class Meta:
        model = User
        fields = (
            'id', 'first_name', 'last_name', 'email', 'role', 'roles',
            'document_number', 'photo', 'phone_number', 'personal_email',
            'google_email', 'second_name', 'second_lastname',
            'is_directory_imported', 'requires_onboarding', 'google_connected',
            'faculty', 'faculty_name', 'program', 'program_name',
            'coordinator_profiles',
        )
        read_only_fields = (
            'id', 'first_name', 'last_name', 'email', 'role', 'roles',
            'document_number', 'second_lastname',
            'google_email', 'is_directory_imported', 'requires_onboarding', 'google_connected',
            'faculty', 'program',
        )

    def update(self, instance, validated_data):
        """
        Actualiza el perfil del usuario.
        Si hay una foto nueva, intenta subirla a Cloudinary.
        Si falla (local sin credenciales), revierte la foto y guarda
        igualmente los demás campos (phone_number, personal_email).
        En producción el try siempre pasa — comportamiento idéntico al original.
        """
        request = self.context.get('request')

        if request and 'photo' in request.FILES:
            instance.photo = request.FILES['photo']
            try:
                # Camino feliz: en producción Cloudinary funciona → retorna aquí
                return super().update(instance, validated_data)
            except Exception:
                # En local sin Cloudinary: revertir foto a la que hay en DB
                # y continuar para guardar phone_number / personal_email
                instance.photo = type(instance).objects.get(pk=instance.pk).photo

        return super().update(instance, validated_data)
