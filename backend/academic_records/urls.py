from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CourseEvaluationViewSet, GradeViewSet, MeetingMinuteViewSet, RubricViewSet, StoredSignatureViewSet

router = DefaultRouter()
router.register(r'minutes', MeetingMinuteViewSet, basename='minutes')
router.register(r'signature', StoredSignatureViewSet, basename='signature')
router.register(r'rubrics', RubricViewSet, basename='rubrics')
router.register(r'evaluations', CourseEvaluationViewSet, basename='evaluations')
router.register(r'grades', GradeViewSet, basename='grades')

urlpatterns = [
    path('', include(router.urls)),
]
