from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from users.models import DirectoryImportBatch
from users.services.directory_import import import_student_directory, revert_directory_batch

User = get_user_model()


def is_admin(user):
    roles = user.roles or [user.role]
    return user.is_superuser or 'ADMIN' in roles


def require_admin(user):
    return None if is_admin(user) else Response(
        {'error': 'Solo administradores pueden gestionar directorios.'},
        status=403,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser])
def import_directory(request):
    denied = require_admin(request.user)
    if denied:
        return denied
    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response({'error': 'Debes adjuntar un archivo Excel.'}, status=400)
    if not file_obj.name.lower().endswith(('.xlsx', '.xlsm')):
        return Response({'error': 'El archivo debe ser .xlsx o .xlsm.'}, status=400)
    try:
        result = import_student_directory(file_obj, created_by=request.user)
    except Exception as exc:
        return Response({'error': f'No se pudo procesar el archivo: {exc}'}, status=400)
    return Response({
        'batch_id': result.batch_id,
        'created': result.created,
        'updated': result.updated,
        'skipped': result.skipped,
        'errors': result.errors,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def check_directory_document(request):
    document = str(request.data.get('document_number', '')).strip()
    if not document or not document.isdigit():
        return Response({'authorized': False, 'error': 'Ingresa un número de documento válido.'}, status=400)
    exists = User.objects.filter(
        document_number=document,
        is_active=True,
        role='STUDENT',
    ).exists()
    if not exists:
        return Response(
            {'authorized': False, 'error': 'Cédula no encontrada en el directorio autorizado.'},
            status=404,
        )
    return Response({'authorized': True})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_directory_document(request):
    denied = require_admin(request.user)
    if denied:
        return denied
    document = str(request.data.get('document_number', '')).strip()
    if not document or not document.isdigit():
        return Response({'document_number': 'Ingresa un número de documento válido.'}, status=400)

    user = User.objects.filter(document_number=document).first()
    if user and user.role not in ('STUDENT', 'ESTUDIANTE') and 'STUDENT' not in (user.roles or []):
        return Response({'error': 'Ese documento pertenece a un usuario que no es estudiante.'}, status=409)

    created = False
    if not user:
        user = User(username=f'dir-{document}', document_number=document, role='STUDENT', roles=['STUDENT'])
        user.set_unusable_password()
        created = True

    optional_fields = {
        'first_name': request.data.get('first_name'),
        'second_name': request.data.get('second_name'),
        'last_name': request.data.get('last_name'),
        'second_lastname': request.data.get('second_lastname'),
        'personal_email': request.data.get('personal_email'),
        'phone_number': request.data.get('phone_number'),
    }
    for field, value in optional_fields.items():
        clean_value = str(value or '').strip()
        if clean_value:
            setattr(user, field, clean_value.lower() if field == 'personal_email' else clean_value)

    user.role = 'STUDENT'
    user.roles = ['STUDENT']
    user.is_active = True
    user.is_directory_imported = True
    user.requires_onboarding = True
    user.save()

    return Response({
        'created': created,
        'document_number': document,
        'message': 'Cédula agregada al directorio autorizado.' if created else 'Cédula autorizada actualizada.',
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def directory_history(request):
    denied = require_admin(request.user)
    if denied:
        return denied
    batches = DirectoryImportBatch.objects.select_related('created_by')[:20]
    return Response([serialize_batch(batch) for batch in batches])


@api_view(['GET', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def directory_batch_detail(request, batch_id):
    denied = require_admin(request.user)
    if denied:
        return denied
    try:
        batch = DirectoryImportBatch.objects.get(id=batch_id)
    except DirectoryImportBatch.DoesNotExist:
        return Response({'error': 'Carga no encontrada.'}, status=404)
    if request.method == 'DELETE':
        if batch.is_reverted:
            batch.delete()
            return Response({'message': 'Registro eliminado del histórico.'})
        affected = revert_directory_batch(batch)
        return Response({'message': 'Carga revertida.', 'affected': affected})
    entries = batch.entries.select_related('user')[:200]
    payload = serialize_batch(batch)
    payload['entries'] = [serialize_entry(entry) for entry in entries]
    return Response(payload)


def serialize_batch(batch):
    return {
        'id': batch.id,
        'file_name': batch.file_name,
        'created_by': batch.created_by.get_full_name() if batch.created_by else '',
        'created_count': batch.created_count,
        'updated_count': batch.updated_count,
        'skipped_count': batch.skipped_count,
        'errors': batch.errors,
        'is_reverted': batch.is_reverted,
        'created_at': batch.created_at,
    }


def serialize_entry(entry):
    return {
        'id': entry.id,
        'action': entry.action,
        'email': entry.email,
        'document_number': entry.document_number,
        'message': entry.message,
        'user_id': entry.user_id,
    }
