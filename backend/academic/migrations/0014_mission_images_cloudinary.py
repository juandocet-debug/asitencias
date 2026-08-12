import cloudinary.models
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('academic', '0013_mission_hero_image_mission_hero_subtitle_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mission',
            name='image',
            field=cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='image'),
        ),
        migrations.AlterField(
            model_name='mission',
            name='hero_image',
            field=cloudinary.models.CloudinaryField(blank=True, help_text='Imagen de portada estilo Fortnite/Gamer', max_length=255, null=True, verbose_name='image'),
        ),
    ]
