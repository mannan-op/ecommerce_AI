from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tryon", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="tryonjob",
            name="abandonment_followup_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
