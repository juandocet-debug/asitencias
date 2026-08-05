from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, SessionViewSet, AttendanceViewSet, DashboardViewSet
from .views.student_overview import StudentAttendanceOverviewView

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'sessions', SessionViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('courses/student-overview/<int:student_id>/', StudentAttendanceOverviewView.as_view()),
    path('', include(router.urls)),
]
