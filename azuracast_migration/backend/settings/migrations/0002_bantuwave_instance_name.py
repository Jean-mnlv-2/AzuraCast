from django.db import migrations, models


def forwards(apps, schema_editor):
    Settings = apps.get_model('settings', 'Settings')
    Settings.objects.filter(instance_name='AzuraCast').update(instance_name='BantuWave')


class Migration(migrations.Migration):
    dependencies = [
        ('settings', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='settings',
            name='instance_name',
            field=models.CharField(default='BantuWave', max_length=255),
        ),
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
