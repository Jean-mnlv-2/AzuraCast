from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, max_length=100)
    name = models.CharField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    
    TYPE_CHOICES = [
        ('individual', 'Particulier'),
        ('organization', 'Organisation'),
    ]
    account_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='individual')
    
    organization_name = models.CharField(max_length=255, null=True, blank=True)
    structure_type = models.CharField(max_length=100, null=True, blank=True) # ex: Entreprise privée
    address = models.TextField(null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    
    locale = models.CharField(max_length=25, null=True, blank=True)
    show_24_hour_time = models.BooleanField(default=True)
    two_factor_secret = models.CharField(max_length=255, null=True, blank=True)
    
    groups = models.ManyToManyField(Group, related_name='user_set', blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    creator = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='created_users'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    class Meta:
        db_table = 'users'

class UserPasskey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='passkeys')
    name = models.CharField(max_length=255)
    full_id = models.TextField()
    public_key_pem = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_passkeys'

class UserLoginToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_tokens')
    token = models.CharField(max_length=64, unique=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'user_login_tokens'

class RolePermission(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='permissions_list')
    station = models.ForeignKey('stations.Station', on_delete=models.CASCADE, related_name='role_permissions', null=True, blank=True)
    action_name = models.CharField(max_length=50)

    class Meta:
        db_table = 'role_permissions'
        unique_together = ('group', 'action_name', 'station')

class ApiKey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys')
    comment = models.CharField(max_length=255, null=True, blank=True)
    key_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_key'
