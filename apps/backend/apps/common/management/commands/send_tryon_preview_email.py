from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.common.email.factory import get_email_backend
from apps.tryon.models import TryOnJob

User = get_user_model()


class Command(BaseCommand):
    help = "Send a preview of the customer try-on follow-up email (for design testing)."

    def add_arguments(self, parser):
        parser.add_argument("recipient", help="Email address to receive the preview.")
        parser.add_argument(
            "--job-id",
            default="",
            help="Try-on job UUID. Defaults to the latest completed job.",
        )

    def handle(self, *args, **options):
        recipient = options["recipient"].strip()
        job_id = options["job_id"].strip()

        qs = TryOnJob.objects.filter(status=TryOnJob.Status.COMPLETED).select_related(
            "user",
            "product",
            "product__category",
            "variant",
        ).prefetch_related("product__images")

        if job_id:
            job = qs.filter(id=job_id).first()
            if not job:
                raise CommandError(f"No completed try-on job found with id {job_id}.")
        else:
            job = qs.order_by("-completed_at").first()
            if not job:
                raise CommandError("No completed try-on jobs found. Run a try-on first.")

        user = job.user
        original_email = user.email
        try:
            if user.email != recipient:
                user.email = recipient
            backend = get_email_backend()
            backend.send_tryon_abandoned_followup(job=job, user=user)
        finally:
            user.email = original_email

        self.stdout.write(
            self.style.SUCCESS(
                f"Preview sent to {recipient} using try-on job {job.id} ({job.product.name})."
            )
        )
