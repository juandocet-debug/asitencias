from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from users.services.directory_import import import_student_directory


def is_admin(user):
    roles = user.roles or [user.role]
    return user.is_superuser or 'ADMIN' in roles


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser])
def import_directory(request):
    if not is_admin(request.user):
        return Response({'error': 'Solo administradores pueden cargar directorios.'}, status=403)
    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response({'error': 'Debes adjuntar un archivo Excel.'}, status=400)
    if not file_obj.name.lower().endswith(('.xlsx', '.xlsm')):
        return Response({'error': 'El archivo debe ser .xlsx o .xlsm.'}, status=400)
    try:
        result = import_student_directory(file_obj)
    except Exception as exc:
        return Response({'error': f'No se pudo procesar el archivo: {exc}'}, status=400)
    return Response({
        'created': result.created,
        'updated': result.updated,
        'skipped': result.skipped,
        'errors': result.errors,
    }, status=status.HTTP_200_OK)
