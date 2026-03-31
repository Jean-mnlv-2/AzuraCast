from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import User, ApiKey, RolePermission

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)
    group_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Group.objects.all(), source='groups'
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'phone', 'account_type', 
            'organization_name', 'structure_type', 'address', 'country',
            'locale', 'show_24_hour_time', 'groups', 'group_ids', 
            'is_staff', 'is_superuser', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class UserAdminUpdateSerializer(serializers.ModelSerializer):
    group_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Group.objects.all(), source='groups', required=False
    )

    class Meta:
        model = User
        fields = [
            'email', 'name', 'phone', 'account_type', 
            'organization_name', 'structure_type', 'address', 'country',
            'locale', 'is_staff', 'is_superuser', 'is_active', 'group_ids'
        ]

    def update(self, instance, validated_data):
        groups = validated_data.pop('groups', None)
        instance = super().update(instance, validated_data)
        if groups is not None:
            instance.groups.set(groups)
        return instance

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'name', 'phone', 'account_type',
            'organization_name', 'structure_type', 'address', 'country', 'locale',
            'is_staff', 'is_superuser', 'is_active'
        ]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        
class ApiKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApiKey
        fields = ['id', 'comment', 'created_at']
        read_only_fields = ['created_at']

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = '__all__'
