from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, SessionViewSet, AttendanceViewSet, DashboardViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'sessions', SessionViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
