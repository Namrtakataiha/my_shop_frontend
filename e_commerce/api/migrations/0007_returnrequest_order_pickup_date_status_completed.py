from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_returnrequest_refund_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='returnrequest',
            name='order',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='return_requests',
                to='api.order',
            ),
        ),
        migrations.AddField(
            model_name='returnrequest',
            name='pickup_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='returnrequest',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('approved', 'Approved'),
                    ('denied', 'Denied'),
                    ('completed', 'Completed'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='returnrequest',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='return_requests',
                to='api.user',
            ),
        ),
    ]
