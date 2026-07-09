from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.template.loader import render_to_string
from email.mime.image import MIMEImage

from apps.common.email.base import EmailBackend
from apps.common.email.context import tryon_followup_context
from apps.common.email.images import InlineImage

User = get_user_model()


class SMTPEmailBackend(EmailBackend):
    def _site_context(self) -> dict:
        return {
            "site_name": getattr(settings, "SITE_NAME", "E-Commerce AI"),
            "site_url": getattr(settings, "SITE_URL", "http://localhost:3000").rstrip("/"),
        }

    def _send_html_email(
        self,
        *,
        subject: str,
        html_body: str,
        to: list[str],
        inline_images: list[InlineImage] | None = None,
    ) -> None:
        """Send designed HTML so Gmail renders the rich template."""
        msg = EmailMessage(
            subject=subject,
            body=html_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to,
        )
        msg.content_subtype = "html"
        msg.mixed_subtype = "related"

        for image in inline_images or []:
            mime_image = MIMEImage(image.data, _subtype=image.mime_type.split("/")[-1])
            mime_image.add_header("Content-ID", f"<{image.cid}>")
            mime_image.add_header(
                "Content-Disposition",
                "inline",
                filename=image.filename,
            )
            msg.attach(mime_image)

        msg.send(fail_silently=False)

    def send_order_confirmation(self, *, order, user) -> bool:
        context = {
            **self._site_context(),
            "order": order,
            "user": user,
            "items": order.items.all(),
        }
        subject = f"Order confirmation #{str(order.id)[:8]}"
        text_body = render_to_string("emails/order_confirmation.txt", context)
        html_body = render_to_string("emails/order_confirmation.html", context)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        return True

    def send_tryon_abandoned_followup(self, *, job, user) -> bool:
        context = tryon_followup_context(job=job, user=user)
        subject = f"Your {job.product.name} try-on is waiting — {context['site_name']}"
        html_body = render_to_string("emails/tryon_abandoned.html", context)

        self._send_html_email(
            subject=subject,
            html_body=html_body,
            to=[user.email],
            inline_images=context.get("inline_images"),
        )
        return True

    def send_tryon_abandoned_staff_alert(self, *, job) -> bool:
        staff_emails = list(
            User.objects.filter(is_staff=True, is_active=True)
            .exclude(email="")
            .values_list("email", flat=True)
        )
        if not staff_emails:
            return False

        context = {
            **self._site_context(),
            "job": job,
            "customer": job.user,
            "product": job.product,
            "admin_url": f"{self._site_context()['site_url']}/admin/tryon",
        }
        subject = f"Try-on lead: {job.user.email} — {job.product.name}"
        text_body = render_to_string("emails/tryon_abandoned_staff.txt", context)
        html_body = render_to_string("emails/tryon_abandoned_staff.html", context)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=staff_emails,
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        return True
