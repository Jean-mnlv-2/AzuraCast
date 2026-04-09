from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from users.models import User, RolePermission
from stations.models import Station

class Command(BaseCommand):
    help = 'Setup RBAC groups and permissions for BantuWave SaaS'

    def handle(self, *args, **options):
        # 1. Commercial & Billing
        commercial_group, _ = Group.objects.get_or_create(name='Commercial & Billing')
        all_commercial_perms = [
            'view_stats_financial', 'manage_billing', 'view_subscriptions', 
            'manage_coupons', 'view_stations_basic', 'view_transactions'
        ]
        for p in all_commercial_perms:
            RolePermission.objects.get_or_create(group=commercial_group, action_name=p)
        self.stdout.write(self.style.SUCCESS('Group "Commercial & Billing" configured'))

        # 2. Tech Support / System Admin
        tech_group, _ = Group.objects.get_or_create(name='Tech Support')
        all_tech_perms = [
            'view_stats_technical', 'manage_infrastructure', 'impersonate_user',
            'view_logs', 'manage_stations_tech', 'restart_services', 'manage_quotas'
        ]
        for p in all_tech_perms:
            RolePermission.objects.get_or_create(group=tech_group, action_name=p)
        self.stdout.write(self.style.SUCCESS('Group "Tech Support" configured'))

        # 3. Ad Manager
        ad_group, _ = Group.objects.get_or_create(name='Ad Manager')
        all_ad_perms = [
            'manage_ads_global', 'view_ads_analytics', 'manage_global_campaigns',
            'upload_ad_media'
        ]
        for p in all_ad_perms:
            RolePermission.objects.get_or_create(group=ad_group, action_name=p)
        self.stdout.write(self.style.SUCCESS('Group "Ad Manager" configured'))

        # 4. Content Curator
        content_group, _ = Group.objects.get_or_create(name='Content Curator')
        all_content_perms = [
            'manage_global_library', 'view_global_library', 'moderate_content'
        ]
        for p in all_content_perms:
            RolePermission.objects.get_or_create(group=content_group, action_name=p)
        self.stdout.write(self.style.SUCCESS('Group "Content Curator" configured'))

        # 5. Super Admin (Total Access)
        super_group, _ = Group.objects.get_or_create(name='SuperAdmins')
        all_perms = [
            'view_statistics', 'view_logs', 'manage_stations', 'manage_users', 
            'manage_roles', 'manage_settings', 'manage_backups', 'manage_infrastructure',
            'view_stats_financial', 'manage_billing', 'manage_ads_global', 'delete_station',
            'view_audit_logs', 'manage_global_campaigns', 'manage_global_library',
            'impersonate_user', 'manage_quotas', 'restart_services', 'moderate_content'
        ]
        for p in all_perms:
            RolePermission.objects.get_or_create(group=super_group, action_name=p)
        
        self.stdout.write(self.style.SUCCESS('Group "SuperAdmins" configured'))
