from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sitios',       views.SitioPracticaViewSet,        basename='sitio-practica')
router.register(r'objetivos',    views.ObjetivoPracticaViewSet,     basename='objetivo-practica')
router.register(r'practicas',    views.PracticaViewSet,             basename='practica')
router.register(r'seguimientos', views.SeguimientoPracticaViewSet,  basename='seguimiento-practica')
router.register(r'asistencias',  views.AsistenciaPracticaViewSet,   basename='asistencia-practica')
router.register(r'reflexiones',  views.ReflexionEstudianteViewSet,  basename='reflexion-estudiante')
router.register(r'tareas',       views.TareaPracticaViewSet,        basename='tarea-practica')
router.register(r'entregas',     views.EntregaTareaViewSet,         basename='entrega-tarea')
router.register(r'evidencias',   views.EvidenciaEntregaViewSet,     basename='evidencia-entrega')

urlpatterns = [
    path('', include(router.urls)),
    path('docentes/',      views.docentes_del_programa, name='docentes-programa'),
    path('join/',          views.join_practica_by_code, name='join-practica'),
    path('mis-practicas/', views.mis_practicas,         name='mis-practicas'),
    path('horas-acumuladas/<int:practica_id>/', views.horas_acumuladas, name='horas-acumuladas'),
]

