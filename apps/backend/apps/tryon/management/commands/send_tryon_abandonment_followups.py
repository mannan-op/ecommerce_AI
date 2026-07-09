from django.core.management.base import BaseCommand

from apps.tryon.services.abandonment import process_abandoned_tryon_followups


class Command(BaseCommand):
    help = "Send abandoned try-on follow-up emails and staff alerts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--seconds",
            type=int,
            default=None,
            help="Override TRYON_ABANDONMENT_SECONDS for this run.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Re-send even if a follow-up was already sent (testing only).",
        )

    def handle(self, *args, **options):
        if options["force"]:
            from apps.tryon.models import TryOnJob

            cleared = TryOnJob.objects.filter(
                abandonment_followup_sent_at__isnull=False
            ).update(abandonment_followup_sent_at=None)
            self.stdout.write(f"Cleared follow-up flag on {cleared} job(s).")

        count = process_abandoned_tryon_followups(seconds=options["seconds"])
        self.stdout.write(self.style.SUCCESS(f"Processed {count} abandoned try-on(s)."))
