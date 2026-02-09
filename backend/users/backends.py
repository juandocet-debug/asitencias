from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class DocumentNumberBackend(ModelBackend):
    """
    Permite autenticación usando document_number en lugar de username.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Intentar buscar por document_number
            user = User.objects.get(document_number=username)
        except User.DoesNotExist:
            # Si no existe, intentar con username normal (email)
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None
        
        # Verificar la contraseña
        if user.check_password(password):
            return user
        return None
