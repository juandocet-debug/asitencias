from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

from users.serializers import UserProfileSerializer
from users.services.onboarding import complete_student_onboarding

REFRESH_COOKIE_PATH = '/api/'


def _profile_response(user, request):
    serializer = UserProfileSerializer(user, context={'request': request})
    data = serializer.data
    if user.pk != request.user.pk:
        refresh = RefreshToken.for_user(user)
        data['access'] = str(refresh.access_token)
        response = Response(data, status=status.HTTP_200_OK)
        response.set_cookie(
            'refresh_token',
            str(refresh),
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax' if settings.DEBUG else 'None',
            path=REFRESH_COOKIE_PATH,
            max_age=7 * 24 * 60 * 60,
        )
        return response
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser])
def complete_onboarding(request):
    password = request.data.get('password', '')
    password_confirm = request.data.get('password_confirm', '')
    phone_number = request.data.get('phone_number', '').strip()
    if not request.user.google_sub and password != password_confirm:
        return Response({'password': 'Las contraseñas no coinciden.'}, status=400)
    if not phone_number:
        return Response({'phone_number': 'El número de celular es obligatorio.'}, status=400)
    try:
        user = complete_student_onboarding(
            request.user,
            password=password,
            phone_number=phone_number,
            photo=request.FILES.get('photo'),
            first_name=request.data.get('first_name', ''),
            second_name=request.data.get('second_name', ''),
            last_name=request.data.get('last_name', ''),
            second_lastname=request.data.get('second_lastname', ''),
            personal_email=request.data.get('personal_email', ''),
            document_number=request.data.get('document_number', ''),
            faculty_id=request.data.get('faculty'),
            program_id=request.data.get('program'),
        )
    except Exception as exc:
        return Response({'error': str(exc)}, status=400)
    return _profile_response(user, request)
