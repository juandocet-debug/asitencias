"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/academic/', include('academic.urls')),
    path('api/users/', include('users.urls')),
    path('api/practicas/', include('practicas.urls')),   # ← Nuevo módulo Prácticas

    # Auth JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

# === TEMPORAL DEBUG ENDPOINT - ELIMINAR DESPUES ===
from django.http import JsonResponse
def debug_courses(request):
    from academic.models import Course
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    courses_data = []
    for c in Course.objects.all().prefetch_related('students'):
        courses_data.append({
            'id': c.id,
            'name': c.name,
            'code': c.code,
            'student_count': c.students.count(),
            'students': [f'{s.id}: {s.first_name} {s.last_name} ({s.email})' for s in c.students.all()]
        })
    
    all_students = User.objects.filter(role='STUDENT').order_by('-date_joined')
    students_data = [
        {'id': u.id, 'name': f'{u.first_name} {u.last_name}', 'email': u.email, 'doc': u.document_number, 'joined': str(u.date_joined)}
        for u in all_students
    ]
    
    return JsonResponse({
        'courses': courses_data,
        'total_courses': len(courses_data),
        'all_students': students_data,
        'total_students': len(students_data),
    })

urlpatterns.insert(0, path('api/debug/courses/', debug_courses))
# === FIN DEBUG ===

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from django.urls import re_path
from django.views.generic import TemplateView

# Serve React App for any other routes (SPA)
# Excluimos /static/, /media/, /assets/, /api/, /admin/ del catch-all
urlpatterns += [
    re_path(r'^(?!static|media|assets|api|admin).*$', TemplateView.as_view(template_name='index.html')),
]

