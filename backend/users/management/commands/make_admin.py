from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class Command(BaseCommand):
    help = 'Actualiza el rol de un usuario a ADMIN por username o documento'

    def add_arguments(self, parser):
        parser.add_argument('identifier', type=str, help='Username o Número de documento del usuario')

    def handle(self, *args, **options):
        identifier = options['identifier']
        
        try:
            user = User.objects.get(Q(username=identifier) | Q(document_number=identifier))
            user.role = 'ADMIN'
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
            self.stdout.write(self.style.SUCCESS(
                f'Usuario {user.username} (Documento: {user.document_number}) actualizado a ADMIN exitosamente'
            ))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f'No se encontr\u00f3 un usuario con el identificador {identifier}'
            ))
        except User.MultipleObjectsReturned:
             self.stdout.write(self.style.ERROR(
                f'M\u00faltiples usuarios encontrados con el identificador {identifier}'
            ))
