from rest_framework import viewsets, permissions
from academic.models import Session
from academic.serializers import SessionSerializer


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
