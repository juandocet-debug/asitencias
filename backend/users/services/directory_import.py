import re
from dataclasses import dataclass

from django.contrib.auth import get_user_model
from django.db import transaction
from openpyxl import load_workbook

User = get_user_model()

HEADER_MAP = {
    'primer nombre': 'first_name',
    'nombre': 'first_name',
    'nombres': 'first_name',
    'primer apellido': 'last_name',
    'apellido': 'last_name',
    'segundo apellido': 'second_lastname',
    'documento': 'document_number',
    'numero de documento': 'document_number',
    'número de documento': 'document_number',
    'cedula': 'document_number',
    'cédula': 'document_number',
    'correo': 'email',
    'correo electronico': 'email',
    'correo electrónico': 'email',
    'email': 'email',
}


@dataclass
class ImportResult:
    created: int
    updated: int
    skipped: int
    errors: list


def normalize_header(value):
    text = re.sub(r'\s+', ' ', str(value or '').strip().lower())
    return HEADER_MAP.get(text)


def clean_cell(value):
    if value is None:
        return ''
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value).strip()


def parse_rows(file_obj):
    workbook = load_workbook(file_obj, read_only=True, data_only=True)
    sheet = workbook.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [normalize_header(item) for item in rows[0]]
    parsed = []
    for index, row in enumerate(rows[1:], start=2):
        item = {key: clean_cell(row[pos]) for pos, key in enumerate(headers) if key}
        if any(item.values()):
            item['_row'] = index
            parsed.append(item)
    return parsed


def validate_row(item):
    required = ['first_name', 'last_name', 'document_number', 'email']
    missing = [field for field in required if not item.get(field)]
    if missing:
        return f"Fila {item['_row']}: faltan {', '.join(missing)}"
    if '@' not in item['email']:
        return f"Fila {item['_row']}: correo inválido"
    if not item['document_number'].isdigit():
        return f"Fila {item['_row']}: documento debe ser numérico"
    return None


@transaction.atomic
def import_student_directory(file_obj):
    created = updated = skipped = 0
    errors = []
    for item in parse_rows(file_obj):
        error = validate_row(item)
        if error:
            errors.append(error)
            skipped += 1
            continue
        result = upsert_student(item)
        if result == 'created':
            created += 1
        elif result == 'updated':
            updated += 1
        else:
            skipped += 1
            errors.append(result)
    return ImportResult(created, updated, skipped, errors[:50])


def upsert_student(item):
    email = item['email'].lower()
    document = item['document_number']
    user = User.objects.filter(email__iexact=email).first()
    document_owner = User.objects.filter(document_number=document).first()
    if document_owner and user and document_owner.id != user.id:
        return f"Fila {item['_row']}: documento pertenece a otro correo"
    if document_owner and not user:
        return f"Fila {item['_row']}: documento ya existe con otro correo"
    if user and user.role not in ('STUDENT', 'ESTUDIANTE') and 'STUDENT' not in (user.roles or []):
        return f"Fila {item['_row']}: el correo pertenece a un usuario no estudiante"
    if not user:
        user = User(username=email, email=email)
        state = 'created'
    else:
        state = 'updated'
    assign_directory_data(user, item)
    user.set_password(document)
    user.save()
    return state


def assign_directory_data(user, item):
    user.first_name = item['first_name']
    user.last_name = item['last_name']
    user.second_lastname = item.get('second_lastname', '')
    user.document_number = item['document_number']
    user.username = item['email'].lower()
    user.email = item['email'].lower()
    user.role = 'STUDENT'
    user.roles = ['STUDENT']
    user.is_active = True
    user.is_directory_imported = True
    user.requires_onboarding = True
