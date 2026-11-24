from django.urls import include, path
from rest_framework.routers import DefaultRouter
from modulos.evaluacion_final.infraestructura.api import FinalEvaluationView

from .grading_views import CourseEvaluationViewSet, GradeViewSet, RubricViewSet
from .views import MeetingMinuteViewSet, StoredSignatureViewSet

router = DefaultRouter()
router.register(r'minutes', MeetingMinuteViewSet, basename='minutes')
router.register(r'signature', StoredSignatureViewSet, basename='signature')
router.register(r'rubrics', RubricViewSet, basename='rubrics')
router.register(r'evaluations', CourseEvaluationViewSet, basename='evaluations')
router.register(r'grades', GradeViewSet, basename='grades')

urlpatterns = [
    path('courses/<int:course_id>/final-evaluation/', FinalEvaluationView.as_view(), name='final-evaluation'),
    path('', include(router.urls)),
]
