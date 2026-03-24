from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import User, ApiKey

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'locale', 'show_24_hour_time', 'groups',
            'is_superuser', 'is_active', 'is_staff', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

class UserAdminUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'email', 'name', 'locale', 'show_24_hour_time',
            'is_superuser', 'is_active', 'password',
        ]

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.is_staff = bool(instance.is_superuser)
        instance.save()
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'name', 'locale', 'is_superuser', 'is_active']

    def create(self, validated_data):
        is_superuser = validated_data.pop('is_superuser', False)
        is_active = validated_data.pop('is_active', True)
        user = User.objects.create_user(**validated_data)
        user.is_superuser = bool(is_superuser)
        user.is_staff = bool(is_superuser)
        user.is_active = bool(is_active)
        user.save()
        return user

class ApiKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApiKey
        fields = ['id', 'comment', 'created_at']
        read_only_fields = ['created_at']
