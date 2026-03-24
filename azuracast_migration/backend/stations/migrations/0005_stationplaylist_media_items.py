from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('media', '0001_initial'),
        ('stations', '0004_stationschedule_station_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='stationplaylist',
            name='media_items',
            field=models.ManyToManyField(
                blank=True,
                related_name='playlists',
                to='media.stationmedia',
            ),
        ),
    ]
