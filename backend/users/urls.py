from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentRegisterView, UserViewSet, password_reset_request,
    password_reset_confirm, join_class, search_all_users, list_courses_for_ilinyx,
    FacultyViewSet, ProgramViewSet, coordinator_types,
)

router = DefaultRouter()
router.register(r'', UserViewSet, basename='users')

# Catálogos
faculty_router = DefaultRouter()
faculty_router.register(r'', FacultyViewSet, basename='faculties')

program_router = DefaultRouter()
program_router.register(r'', ProgramViewSet, basename='programs')

urlpatterns = [
    path('register/student/', StudentRegisterView.as_view(), name='student-register'),
    path('password-reset/', password_reset_request, name='password-reset-request'),
    path('password-reset-confirm/', password_reset_confirm, name='password-reset-confirm'),
    path('join-class/', join_class, name='join-class'),
    path('search/', search_all_users, name='users-search'),
    path('courses-for-ilinyx/', list_courses_for_ilinyx, name='courses-for-ilinyx'),
    # Catálogos académicos
    path('faculties/', include(faculty_router.urls)),
    path('programs/', include(program_router.urls)),
    path('coordinator-types/', coordinator_types, name='coordinator-types'),
    # CRUD de usuarios (debe ir último por el catch-all del router)
    path('', include(router.urls)),
]
