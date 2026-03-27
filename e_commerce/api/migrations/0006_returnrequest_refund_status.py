from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_productrating_returnrequest_wishlist'),
    ]

    operations = [
        migrations.AddField(
            model_name='returnrequest',
            name='refund_status',
            field=models.CharField(
                choices=[('none', 'None'), ('pending', 'Pending'), ('processed', 'Processed')],
                default='none',
                max_length=20,
            ),
        ),
    ]
