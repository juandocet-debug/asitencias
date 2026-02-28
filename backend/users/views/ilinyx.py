# users/views/ilinyx.py
# Endpoints exclusivos para la comunicación server-to-server con ILINYX.
# NUNCA deben ser llamados desde el browser — solo desde el backend de ILINYX.
# Autenticación: header X-Ilinyx-Api-Key (no requiere JWT de usuario).

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.conf import settings

User = get_user_model()


def _check_ilinyx_key(request):
    """
    Verifica que el header X-Ilinyx-Api-Key sea correcto.
    Retorna True si autorizado, False si rechazado.
    """
    expected_key = getattr(settings, 'ILINYX_API_KEY', None)
    received_key = request.headers.get('X-Ilinyx-Api-Key', '')
    return bool(expected_key and received_key == expected_key)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # La auth es via API key en el header
def search_all_users(request):
    """
    Busca usuarios de AGON para el autocomplete de ILINYX.
    Requiere header X-Ilinyx-Api-Key.
    ?q=término → filtra por nombre / apellido / cédula / email (mínimo 2 caracteres)
    """
    if not _check_ilinyx_key(request):
        return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    q = request.query_params.get('q', '').strip()
    if len(q) < 2:
        return Response([])

    qs = User.objects.filter(
        Q(first_name__icontains=q) |
        Q(last_name__icontains=q)  |
        Q(username__icontains=q)   |
        Q(email__icontains=q)
    ).order_by('first_name', 'last_name')[:20]

    from ..serializers import UserSerializer
    return Response(UserSerializer(qs, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # La auth es via API key en el header
def list_courses_for_ilinyx(request):
    """
    Lista las clases de AGON con sus estudiantes para que ILINYX pueda
    importar clases completas al crear actas (carga masiva de asistentes).
    Requiere header X-Ilinyx-Api-Key.
    """
    if not _check_ilinyx_key(request):
        return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    from academic.models import Course
    courses = Course.objects.all().prefetch_related('students').select_related('teacher')

    result = []
    for course in courses:
        students = [
            {
                'id':              s.id,
                'first_name':      s.first_name,
                'last_name':       s.last_name,
                'email':           s.email,
                'role':            s.role,
                'document_number': s.document_number,
                'photo':           s.photo.url if s.photo else None,
            }
            for s in course.students.all()
        ]

        result.append({
            'id':            course.id,
            'name':          course.name,
            'code':          course.code,
            'year':          course.year,
            'period':        course.period,
            'teacher_name':  f'{course.teacher.first_name} {course.teacher.last_name}'.strip(),
            'teacher_id':    course.teacher.id,
            'student_count': len(students),
            'students':      students,
        })

    return Response(result)
