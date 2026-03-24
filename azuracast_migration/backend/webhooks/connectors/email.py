from django.core.mail import send_mail
from django.conf import settings
from . import BaseConnector

class EmailConnector(BaseConnector):
    def send(self, config: dict, context: dict):
        email_to = config.get('to')
        if not email_to:
            return
            
        email_subject = self.replace_variables(config.get('subject', 'Now playing on {{ station }}'), context)
        email_message = self.replace_variables(config.get('message', 'Title: {{ title }} by {{ artist }}'), context)
        
        to_list = [email.strip() for email in email_to.split(',')]
        
        try:
            send_mail(
                subject=email_subject,
                message=email_message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@bantuwave.com'),
                recipient_list=to_list,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email Webhook failed: {e}")
