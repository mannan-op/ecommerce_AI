from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from apps.common.email.base import EmailBackend


class SMTPEmailBackend(EmailBackend):
    def send_order_confirmation(self, *, order, user) -> bool:
        context = {
            "order": order,
            "user": user,
            "items": order.items.all(),
            "site_name": getattr(settings, "SITE_NAME", "E-Commerce AI"),
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
