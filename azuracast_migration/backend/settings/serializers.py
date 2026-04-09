from rest_framework import serializers
from .models import Settings
from auditlog.models import LogEntry

class LogEntrySerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = LogEntry
        fields = ['id', 'object_repr', 'action', 'changes', 'timestamp', 'user_email']

    def get_user_email(self, obj):
        return obj.actor.email if obj.actor else 'System'

class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = '__all__'
