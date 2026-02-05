import os
import django
import sys
from django.conf import settings

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

try:
    from users.models import User
    from users.serializers import UserSerializer
    
    print("Testing User Query...")
    users = User.objects.all()
    print(f"Found {users.count()} users")
    
    print("Testing Serializer...")
    serializer = UserSerializer(users, many=True)
    data = serializer.data
    # print(data) # Don't print private data to logs
    print("Serialization Successful!")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
