from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from academic.models import Course

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer de solo lectura para listar usuarios."""

    class Meta:
        model = User
        fields = (
            'id', 'username', 'first_name', 'last_name', 'email', 'role',
            'document_number', 'second_name', 'second_lastname',
            'personal_email', 'phone_number', 'photo'
        )

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.photo:
            representation['photo'] = instance.photo.url
        return representation


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para que el ADMIN cree usuarios (cualquier rol).
    Maneja correctamente el hasheo de contraseña con set_password().
    """
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            'username', 'password', 'first_name', 'last_name', 'email',
            'role', 'document_number', 'second_name', 'second_lastname',
            'personal_email', 'phone_number',
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

        # Si no viene username, usarlo del email
        if not validated_data.get('username'):
            validated_data['username'] = validated_data.get('email', '')

        # Crear con create_user para que el password sea hasheado correctamente
        user = User(**validated_data)
        user.set_password(password)
        user.save()
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

    class Meta:
        model = User
        fields = (
            'username', 'password', 'first_name', 'last_name', 'email',
            'role', 'document_number', 'second_name', 'second_lastname',
            'personal_email', 'phone_number',
        )

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Solo actualizar contraseña si se proporcionó una
        if password:
            instance.set_password(password)

        instance.save()
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
            'phone_number', 'photo', 'class_code'
        )

    def create(self, validated_data):
        class_code = validated_data.pop('class_code', None)
        password = validated_data.pop('password')

        # Forzar rol STUDENT
        validated_data['role'] = 'STUDENT'

        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        if class_code:
            try:
                course = Course.objects.get(code=class_code)
                course.students.add(user)
            except Course.DoesNotExist:
                pass

        return user

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.photo:
            representation['photo'] = instance.photo.url
        return representation


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para que el usuario edite su propio perfil."""
    class Meta:
        model = User
        fields = (
            'id', 'first_name', 'last_name', 'email', 'role',
            'document_number', 'photo', 'phone_number', 'personal_email'
        )
        read_only_fields = ('id', 'first_name', 'last_name', 'email', 'role', 'document_number')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.photo:
            request = self.context.get('request')
            if request:
                representation['photo'] = request.build_absolute_uri(instance.photo.url)
            else:
                representation['photo'] = instance.photo.url
        return representation
