from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Send a test email through the configured SMTP backend (e.g. Gmail)."

    def add_arguments(self, parser):
        parser.add_argument(
            "recipient",
            nargs="?",
            default="",
            help="Recipient email address (defaults to EMAIL_HOST_USER).",
        )

    def handle(self, *args, **options):
        if "console" in settings.EMAIL_BACKEND:
            raise CommandError(
                "EMAIL_BACKEND is still set to console. "
                "Set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend in .env."
            )

        user = settings.EMAIL_HOST_USER
        password = settings.EMAIL_HOST_PASSWORD
        if not user or not password:
            raise CommandError(
                "Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in apps/backend/.env "
                "(use a Gmail App Password, not your login password)."
            )

        recipient = options["recipient"] or user
        from_email = settings.DEFAULT_FROM_EMAIL or user

        send_mail(
            subject=f"Test email from {settings.SITE_NAME}",
            message=(
                "If you received this, Gmail SMTP is configured correctly.\n\n"
                f"From: {from_email}\n"
                f"Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}"
            ),
            from_email=from_email,
            recipient_list=[recipient],
            fail_silently=False,
        )
        self.stdout.write(
            self.style.SUCCESS(f"Test email sent to {recipient} via {settings.EMAIL_HOST}.")
        )
