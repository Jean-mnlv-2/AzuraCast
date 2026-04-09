
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from users.models import User, RolePermission

class Command(BaseCommand):
    help = 'Creates a SuperAdmins group, assigns all permissions, and adds the default superuser.'

    GLOBAL_PERMISSIONS = [
        'view_statistics',
        'view_logs',
        'manage_stations',
        'manage_users',
        'manage_roles',
        'manage_api_keys',
        'manage_settings',
        'manage_custom_fields',
        'manage_backups',
        'manage_branding',
    ]

    STATION_PERMISSIONS = [
        'view_station',
        'manage_profile',
        'manage_streamers',
        'manage_mounts',
        'manage_remotes',
        'manage_media',
        'manage_playlists',
        'manage_schedules',
        'manage_podcasts',
        'manage_webhooks',
        'view_reports',
        'view_listeners',
    ]

    def handle(self, *args, **options):
        self.stdout.write("Setting up SuperAdmins group...")

        group, created = Group.objects.get_or_create(name='SuperAdmins')
        if created:
            self.stdout.write(self.style.SUCCESS(f'Group "SuperAdmins" created.'))
        else:
            self.stdout.write(f'Group "SuperAdmins" already exists.')

        RolePermission.objects.filter(group=group).delete()
        self.stdout.write(f'Cleared existing RolePermissions for SuperAdmins group.')

        for perm_name in self.GLOBAL_PERMISSIONS:
            RolePermission.objects.create(group=group, action_name=perm_name)
        
        self.stdout.write(self.style.SUCCESS(f'Assigned {len(self.GLOBAL_PERMISSIONS)} global permissions to the group.'))

        self.stdout.write("Note: Station-level permissions are assigned per station. Superusers have access to all stations by default.")
        
        try:
            superuser = User.objects.get(email='admin@bantuwave.com', is_superuser=True)
            if superuser not in group.user_set.all():
                group.user_set.add(superuser)
                self.stdout.write(self.style.SUCCESS(f'Added user "{superuser.email}" to the "SuperAdmins" group.'))
            else:
                self.stdout.write(f'User "{superuser.email}" is already in the "SuperAdmins" group.')
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('Default superuser "admin@bantuwave.com" not found.'))

        self.stdout.write(self.style.SUCCESS("Permission setup complete."))
