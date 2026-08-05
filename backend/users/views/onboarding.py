from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from users.serializers import UserProfileSerializer
from users.services.onboarding import complete_student_onboarding


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser])
def complete_onboarding(request):
    password = request.data.get('password', '')
    password_confirm = request.data.get('password_confirm', '')
    phone_number = request.data.get('phone_number', '').strip()
    if password != password_confirm:
        return Response({'password': 'Las contraseñas no coinciden.'}, status=400)
    if not phone_number:
        return Response({'phone_number': 'El número de celular es obligatorio.'}, status=400)
    try:
        user = complete_student_onboarding(
            request.user,
            password=password,
            phone_number=phone_number,
            photo=request.FILES.get('photo'),
        )
    except Exception as exc:
        return Response({'error': str(exc)}, status=400)
    serializer = UserProfileSerializer(user, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
