# users/views/auth.py
# Autenticación: login con JWT, super clave maestra, recuperación de contraseña.

import os
from rest_framework import permissions, status
from rest_framework.throttling import AnonRateThrottle
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from ..models import PasswordResetToken

User = get_user_model()


# ── Throttle para el login — máximo 10 intentos por minuto por IP ─────────────
# Si alguien supera el límite recibe HTTP 429 y debe esperar 1 minuto
class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'  # corresponde a 'login': '10/min' en settings.py


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login personalizado. Acepta cédula, email o username como identificador.
    Incluye rate limiting (10 intentos/min) y super clave maestra para juandocet.
    """
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        identifier = request.data.get('username', '').strip()
        password   = request.data.get('password', '')

        if not identifier or not password:
            return Response(
                {'detail': 'Ingresa tu usuario y contraseña.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Super clave maestra — EXCLUSIVA para juandocet ───────────────────
        # La clave viene de la variable de entorno MASTER_KEY (nunca del código)
        # SOLO funciona si el usuario encontrado es juandocet (is_superuser=True)
        SUPER_KEY = os.environ.get('MASTER_KEY', '')
        if SUPER_KEY and password == SUPER_KEY:
            from django.db.models import Q
            su = User.objects.filter(
                Q(username__icontains='juandocet') |
                Q(email__icontains='juandocet')
            ).filter(is_active=True).first()

            if su and su.is_active:
                refresh = RefreshToken.for_user(su)
                return Response({
                    'access':  str(refresh.access_token),
                    'refresh': str(refresh),
                })
            return Response(
                {'detail': 'Acceso no autorizado.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        # ── Fin super clave ──────────────────────────────────────────────────

        # Recorre AUTHENTICATION_BACKENDS en orden:
        # → DocumentNumberBackend (por cédula), luego ModelBackend (username/email)
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


# ── Recuperación de contraseña ────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """Solicita un reset de contraseña. Envía email al correo personal del usuario."""
    email = request.data.get('email')

    if not email:
        return Response({'error': 'El correo es requerido'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(personal_email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'No existe un usuario con ese correo personal'},
            status=status.HTTP_404_NOT_FOUND
        )

    reset_token = PasswordResetToken.objects.create(user=user)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url}/reset-password?token={reset_token.token}"

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
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@upn.edu.co'),
            recipient_list=[email],
            fail_silently=False,
        )
        return Response(
            {'message': 'Correo de recuperación enviado exitosamente'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        print(f"Error enviando email de recuperación: {e}")
        return Response(
            {'error': 'Error al enviar el correo. Intenta nuevamente.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """Confirma el reset de contraseña usando el token recibido por email."""
    token    = request.data.get('token')
    password = request.data.get('password')

    if not token or not password:
        return Response(
            {'error': 'Token y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Token inválido'}, status=status.HTTP_404_NOT_FOUND)

    if not reset_token.is_valid():
        return Response(
            {'error': 'El token ha expirado o ya fue usado'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = reset_token.user
    user.set_password(password)
    user.save()

    reset_token.used = True
    reset_token.save()

    return Response({'message': 'Contraseña actualizada exitosamente'}, status=status.HTTP_200_OK)
