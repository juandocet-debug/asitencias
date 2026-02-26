from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SitioPractica, ObjetivoPractica, Practica, SeguimientoPractica, AsistenciaPractica

User = get_user_model()


class UserCompactSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'document_number', 'role', 'roles', 'photo')

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip()

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.photo:
            try:
                rep['photo'] = instance.photo.url
            except Exception:
                pass
        return rep


class SitioPracticaSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = SitioPractica
        fields = (
            'id', 'name', 'address', 'description',
            'contact_name', 'phone_fixed', 'phone_mobile',
            'program', 'program_name', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'program_name')


class ObjetivoPracticaSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = ObjetivoPractica
        fields = ('id', 'name', 'description', 'program', 'program_name', 'created_at')
        read_only_fields = ('id', 'created_at', 'program_name')


class PracticaSerializer(serializers.ModelSerializer):
    program_name     = serializers.CharField(source='program.name', read_only=True)
    coordinator_info = UserCompactSerializer(source='coordinator', read_only=True)
    profesor_info    = UserCompactSerializer(source='profesor_practica', read_only=True)
    sitios_detail    = SitioPracticaSerializer(source='sitios', many=True, read_only=True)
    objetivos_detail = ObjetivoPracticaSerializer(source='objetivos', many=True, read_only=True)
    student_count    = serializers.SerializerMethodField(read_only=True)

    sitios    = serializers.PrimaryKeyRelatedField(queryset=SitioPractica.objects.all(), many=True, required=False)
    objetivos = serializers.PrimaryKeyRelatedField(queryset=ObjetivoPractica.objects.all(), many=True, required=False)

    class Meta:
        model = Practica
        fields = (
            'id', 'name', 'program', 'program_name',
            'coordinator', 'coordinator_info',
            'profesor_practica', 'profesor_info',
            'sitios', 'sitios_detail',
            'objetivos', 'objetivos_detail',
            'year', 'period', 'code',
            'student_count', 'is_active', 'created_at',
        )
        read_only_fields = ('id', 'code', 'created_at')

    def get_student_count(self, obj):
        return obj.students.count()


class PracticaStudentsSerializer(serializers.ModelSerializer):
    """Serializer de detalle con lista de estudiantes."""
    students = UserCompactSerializer(many=True, read_only=True)

    class Meta:
        model = Practica
        fields = ('id', 'name', 'code', 'students')


class AsistenciaPracticaSerializer(serializers.ModelSerializer):
    student_info = UserCompactSerializer(source='student', read_only=True)

    class Meta:
        model = AsistenciaPractica
        fields = ('id', 'seguimiento', 'student', 'student_info', 'status', 'comment')
        read_only_fields = ('id',)


class SeguimientoPracticaSerializer(serializers.ModelSerializer):
    sitio_name      = serializers.CharField(source='sitio.name', read_only=True, default=None)
    created_by_name = serializers.SerializerMethodField(read_only=True)
    asistencias     = AsistenciaPracticaSerializer(many=True, read_only=True)

    class Meta:
        model = SeguimientoPractica
        fields = (
            'id', 'practica', 'sitio', 'sitio_name',
            'date', 'topic', 'novedades',
            'created_by', 'created_by_name',
            'asistencias', 'created_at',
        )
        read_only_fields = ('id', 'created_at', 'created_by', 'sitio_name', 'created_by_name')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
        return None
