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
    station_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'phone', 'account_type', 
            'organization_name', 'structure_type', 'address', 'country',
            'locale', 'show_24_hour_time', 'groups', 'group_ids', 
            'is_staff', 'is_superuser', 'is_active', 'created_at', 'updated_at',
            'station_permissions'
        ]
        read_only_fields = ['created_at', 'updated_at', 'station_permissions']

    def get_station_permissions(self, obj):
        from guardian.shortcuts import get_objects_for_user
        from stations.models import Station
        
        available_permissions = [
            'view_station', 'manage_station', 'manage_station_profile',
            'manage_station_media', 'manage_station_playlists', 'manage_station_streamers',
            'manage_station_mounts', 'manage_station_remotes', 'manage_station_webhooks',
            'manage_station_podcasts', 'manage_station_hls', 'manage_station_analytics'
        ]
        
        perms_map = {}
        for perm in available_permissions:
            stations = get_objects_for_user(obj, f'stations.{perm}', klass=Station)
            for s in stations:
                if s.short_name not in perms_map:
                    perms_map[s.short_name] = []
                perms_map[s.short_name].append(perm)
        
        return perms_map

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
