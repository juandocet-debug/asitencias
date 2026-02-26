from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SitioPractica, ObjetivoPractica, Practica

User = get_user_model()


# ─── Serializer compacto de usuario (para listas de docentes / coordinadores) ─
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
            rep['photo'] = instance.photo.url
        return rep


# ─── Sitio de Práctica ────────────────────────────────────────────────────────
class SitioPracticaSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = SitioPractica
        fields = ('id', 'name', 'address', 'description', 'program', 'program_name', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at', 'program_name')


# ─── Objetivo de Práctica ─────────────────────────────────────────────────────
class ObjetivoPracticaSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = ObjetivoPractica
        fields = ('id', 'name', 'description', 'program', 'program_name', 'created_at')
        read_only_fields = ('id', 'created_at', 'program_name')


# ─── Práctica ─────────────────────────────────────────────────────────────────
class PracticaSerializer(serializers.ModelSerializer):
    program_name          = serializers.CharField(source='program.name', read_only=True)
    coordinator_name      = serializers.SerializerMethodField(read_only=True)
    profesor_name         = serializers.SerializerMethodField(read_only=True)
    sitios_detail         = SitioPracticaSerializer(source='sitios', many=True, read_only=True)
    objetivos_detail      = ObjetivoPracticaSerializer(source='objetivos', many=True, read_only=True)
    student_count         = serializers.SerializerMethodField(read_only=True)

    # Write: IDs de sitios y objetivos
    sitios    = serializers.PrimaryKeyRelatedField(queryset=SitioPractica.objects.all(), many=True, required=False)
    objetivos = serializers.PrimaryKeyRelatedField(queryset=ObjetivoPractica.objects.all(), many=True, required=False)

    class Meta:
        model = Practica
        fields = (
            'id', 'name', 'program', 'program_name',
            'coordinator', 'coordinator_name',
            'profesor_practica', 'profesor_name',
            'sitios', 'sitios_detail',
            'objetivos', 'objetivos_detail',
            'year', 'period', 'code',
            'student_count', 'is_active', 'created_at',
        )
        read_only_fields = ('id', 'code', 'created_at', 'program_name', 'coordinator_name',
                            'profesor_name', 'sitios_detail', 'objetivos_detail', 'student_count')

    def get_coordinator_name(self, obj):
        if obj.coordinator:
            return f'{obj.coordinator.first_name} {obj.coordinator.last_name}'.strip()
        return None

    def get_profesor_name(self, obj):
        if obj.profesor_practica:
            return f'{obj.profesor_practica.first_name} {obj.profesor_practica.last_name}'.strip()
        return None

    def get_student_count(self, obj):
        return obj.students.count()
