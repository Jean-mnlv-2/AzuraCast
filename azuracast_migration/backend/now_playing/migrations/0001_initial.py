from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('media', '0002_initial'),
        ('stations', '0005_stationplaylist_media_items'),
    ]

    operations = [
        migrations.CreateModel(
            name='NowPlaying',
            fields=[
                ('listeners_total', models.IntegerField(default=0)),
                ('listeners_unique', models.IntegerField(default=0)),
                ('timestamp_start', models.DateTimeField(blank=True, null=True)),
                ('cache', models.JSONField(blank=True, default=dict)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'current_media',
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='now_playing_media',
                        to='media.stationmedia',
                    ),
                ),
                (
                    'current_song',
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='now_playing_current',
                        to='media.song',
                    ),
                ),
                (
                    'station',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name='now_playing',
                        serialize=False,
                        to='stations.station',
                    ),
                ),
            ],
            options={
                'db_table': 'now_playing',
            },
        ),
    ]

