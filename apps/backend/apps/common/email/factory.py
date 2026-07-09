from django.conf import settings

from apps.common.email.base import EmailBackend
from apps.common.email.smtp import SMTPEmailBackend


class SendGridEmailBackend(EmailBackend):
    """SendGrid via SMTP relay — uses Django's email backend with SendGrid credentials."""

    def send_order_confirmation(self, *, order, user) -> bool:
        return SMTPEmailBackend().send_order_confirmation(order=order, user=user)

    def send_tryon_abandoned_followup(self, *, job, user) -> bool:
        return SMTPEmailBackend().send_tryon_abandoned_followup(job=job, user=user)

    def send_tryon_abandoned_staff_alert(self, *, job) -> bool:
        return SMTPEmailBackend().send_tryon_abandoned_staff_alert(job=job)


def get_email_backend() -> EmailBackend:
    provider = getattr(settings, "EMAIL_PROVIDER", "smtp")
    if provider == "sendgrid":
        return SendGridEmailBackend()
    return SMTPEmailBackend()
