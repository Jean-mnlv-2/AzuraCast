from rest_framework import serializers
from .models import StationWebhook

class StationWebhookSerializer(serializers.ModelSerializer):
    station = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = StationWebhook
        fields = '__all__'
        read_only_fields = ('station',)
