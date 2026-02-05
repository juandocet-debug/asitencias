from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentRegisterView, UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet)

urlpatterns = [
    path('register/student/', StudentRegisterView.as_view(), name='student-register'),
    path('', include(router.urls)),
]
