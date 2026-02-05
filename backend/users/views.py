from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import StudentRegisterSerializer, UserSerializer

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    # TODO: Add IsAdminUser permission later
    permission_classes = [permissions.AllowAny] 

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
