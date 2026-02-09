from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentRegisterView, UserViewSet, password_reset_request, password_reset_confirm

router = DefaultRouter()
router.register(r'', UserViewSet)

urlpatterns = [
    path('register/student/', StudentRegisterView.as_view(), name='student-register'),
    path('password-reset/', password_reset_request, name='password-reset-request'),
    path('password-reset-confirm/', password_reset_confirm, name='password-reset-confirm'),
    path('', include(router.urls)),
]
