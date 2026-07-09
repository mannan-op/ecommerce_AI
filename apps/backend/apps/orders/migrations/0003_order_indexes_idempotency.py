# Generated manually for production hardening

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0002_order_discount_order_estimated_delivery_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="idempotency_key",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["user", "-created_at"], name="orders_orde_user_id_6b3f2d_idx"),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["status"], name="orders_orde_status_f8c8c1_idx"),
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.UniqueConstraint(
                condition=~models.Q(idempotency_key="")
                & ~models.Q(idempotency_key__isnull=True),
                fields=("user", "idempotency_key"),
                name="unique_idempotency_per_user",
            ),
        ),
    ]
