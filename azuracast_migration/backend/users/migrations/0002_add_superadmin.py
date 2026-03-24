from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_superadmin(apps, schema_editor):
    User = apps.get_model('users', 'User')
    if not User.objects.filter(email='admin@bantuwave.com').exists():
        User.objects.create(
            email='admin@bantuwave.com',
            password=make_password('AdminPassword123!'),
            is_superuser=True,
            is_staff=True,
            name='BantuWave SuperAdmin',
            is_active=True
        )

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_superadmin),
    ]
