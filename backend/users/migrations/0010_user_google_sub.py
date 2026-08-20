from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0009_directoryimportbatch_user_directory_batch_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='google_sub',
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
    ]
