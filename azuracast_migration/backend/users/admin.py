from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, RolePermission, ApiKey

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'account_type', 'country', 'is_staff', 'is_active', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'account_type', 'country')
    search_fields = ('email', 'name')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'phone', 'account_type', 'organization_name', 'structure_type', 'address', 'country', 'locale', 'show_24_hour_time')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'name', 'account_type', 'is_staff', 'is_active'),
        }),
    )

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('group', 'station', 'action_name')
    list_filter = ('group', 'station', 'action_name')

@admin.register(ApiKey)
class ApiKeyAdmin(admin.ModelAdmin):
    list_display = ('user', 'comment', 'created_at')
    list_filter = ('user', 'created_at')
    search_fields = ('user__email', 'comment')
    readonly_fields = ('created_at',)
