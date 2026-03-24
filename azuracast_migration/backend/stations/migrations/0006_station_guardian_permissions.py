from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('stations', '0005_stationplaylist_media_items'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='station',
            options={
                'db_table': 'station',
                'permissions': [
                    ('manage_station', 'Can manage station'),
                ],
            },
        ),
    ]
