from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sitios',      views.SitioPracticaViewSet,     basename='sitio-practica')
router.register(r'objetivos',   views.ObjetivoPracticaViewSet,  basename='objetivo-practica')
router.register(r'practicas',   views.PracticaViewSet,          basename='practica')
router.register(r'seguimientos',views.SeguimientoPracticaViewSet,basename='seguimiento-practica')
router.register(r'asistencias', views.AsistenciaPracticaViewSet, basename='asistencia-practica')

urlpatterns = [
    path('', include(router.urls)),
    path('docentes/', views.docentes_del_programa, name='docentes-programa'),
    path('join/',     views.join_practica_by_code, name='join-practica'),
]
