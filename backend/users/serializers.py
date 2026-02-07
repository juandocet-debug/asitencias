from rest_framework import serializers
from django.contrib.auth import get_user_model
from academic.models import Course

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'role', 'document_number', 'second_name', 'second_lastname', 'personal_email', 'phone_number', 'photo')
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.photo:
            # CloudinaryField ya devuelve la URL completa
            representation['photo'] = instance.photo.url
        return representation

class StudentRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class_code = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('username', 'password', 'first_name', 'second_name', 'last_name', 'second_lastname', 'email', 'personal_email', 'document_number', 'phone_number', 'photo', 'class_code')

    def create(self, validated_data):
        class_code = validated_data.pop('class_code', None)
        password = validated_data.pop('password')
        
        # Force role to STUDENT
        validated_data['role'] = 'STUDENT'
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        if class_code:
            try:
                course = Course.objects.get(code=class_code)
                course.students.add(user)
            except Course.DoesNotExist:
                # Opcional: Manejar error si el código no existe (por ahora lo ignoramos o podríamos lanzar error)
                pass
        
        return user
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.photo:
            # CloudinaryField ya devuelve la URL completa
            representation['photo'] = instance.photo.url
        return representation


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'role', 'document_number', 'photo', 'phone_number', 'personal_email')
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

