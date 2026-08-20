# users/views/__init__.py
# Re-exporta todo lo necesario para que Django y urls.py no noten el cambio
# de views.py (archivo) → views/ (carpeta).
# Cualquier: from users.views import X  → sigue funcionando igual.

from .auth import (
    LoginRateThrottle,
    CustomTokenObtainPairView,
    CookieTokenRefreshView,
    logout_view,
    password_reset_request,
    password_reset_confirm,
    google_login,
)

from .users import (
    UserViewSet,
    StudentRegisterView,
    join_class,
    FacultyViewSet,
    ProgramViewSet,
    coordinator_types,
)

from .directory import import_directory, directory_history, directory_batch_detail
from .onboarding import complete_onboarding

from .ilinyx import (
    search_all_users,
    list_courses_for_ilinyx,
)
