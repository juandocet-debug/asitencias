# users/views/__init__.py
# Re-exporta todo lo necesario para que Django y urls.py no noten el cambio
# de views.py (archivo) → views/ (carpeta).
# Cualquier: from users.views import X  → sigue funcionando igual.

from .auth import (
    LoginRateThrottle,
    CustomTokenObtainPairView,
    password_reset_request,
    password_reset_confirm,
)

from .users import (
    UserViewSet,
    StudentRegisterView,
    join_class,
    FacultyViewSet,
    ProgramViewSet,
    coordinator_types,
)

from .ilinyx import (
    search_all_users,
    list_courses_for_ilinyx,
)
