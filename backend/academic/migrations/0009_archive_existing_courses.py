from django.db import migrations, models
from django.utils import timezone


def archive_existing_courses(apps, schema_editor):
    Course = apps.get_model('academic', 'Course')
    Course.objects.filter(is_archived=False).update(
        is_archived=True,
        archived_at=timezone.now(),
    )


def restore_existing_courses(apps, schema_editor):
    Course = apps.get_model('academic', 'Course')
    Course.objects.filter(is_archived=True).update(
        is_archived=False,
        archived_at=None,
    )


class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0008_course_color'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='is_archived',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name='course',
            name='archived_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(archive_existing_courses, restore_existing_courses),
    ]
