import logging
from django.core.mail import EmailMultiAlternatives, get_connection
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

def get_centralized_connection():
    """
    Returns a mail connection using centralized SMTP settings from the database.
    If database settings are disabled or incomplete, falls back to settings.py.
    """
    from settings.models import Settings
    db_settings = Settings.get_instance()

    if db_settings.mail_enabled and db_settings.mail_smtp_host:
        return get_connection(
            host=db_settings.mail_smtp_host,
            port=db_settings.mail_smtp_port,
            username=db_settings.mail_smtp_user,
            password=db_settings.mail_smtp_password,
            use_tls=(db_settings.mail_smtp_secure == 'tls'),
            use_ssl=(db_settings.mail_smtp_secure == 'ssl'),
        )
    return get_connection()

def send_centralized_email(subject, html_template, context, to_emails, from_email=None):
    """
    Core function to send emails using centralized connection.
    """
    from settings.models import Settings
    db_settings = Settings.get_instance()

    if not from_email:
        from_email = db_settings.mail_sender_email or settings.DEFAULT_FROM_EMAIL
    
    sender_name = db_settings.mail_sender_name or "BantuWave"
    full_from_email = f"{sender_name} <{from_email}>"

    html_content = render_to_string(html_template, context)
    text_content = strip_tags(html_content)
    
    connection = get_centralized_connection()
    msg = EmailMultiAlternatives(
        subject, 
        text_content, 
        full_from_email, 
        to_emails, 
        connection=connection
    )
    msg.attach_alternative(html_content, "text/html")
    
    try:
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        logger.error(f"Échec de l'envoi de l'e-mail à {to_emails}: {e}")
        return False

def send_radio_creation_email(user, station, admin_pw, source_pw):
    """
    Envoie un e-mail de bienvenue à l'utilisateur lors de la création d'une radio.
    """
    context = {
        'user': user,
        'station': station,
        'admin_pw': admin_pw,
        'source_pw': source_pw,
        'login_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:8080') + '/login',
    }
    return send_centralized_email(
        f"Bienvenue sur BantuWave - Votre station {station.name} est prête !",
        'emails/radio_creation.html',
        context,
        [user.email]
    )

def send_welcome_email(user):
    """
    Envoie un e-mail de bienvenue professionnel lors de l'inscription.
    """
    context = {
        'user': user,
        'login_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:8080') + '/login',
    }
    return send_centralized_email(
        "Bienvenue sur BantuWave !",
        'emails/welcome.html',
        context,
        [user.email]
    )

def send_system_alert(subject, message):
    """
    Envoie une alerte système au superadmin.
    """
    from users.models import User
    superadmins = User.objects.filter(is_superuser=True).values_list('email', flat=True)
    if not superadmins:
        return
    
    context = {'message': message, 'subject': subject}
    return send_centralized_email(
        f"[ALERTE SYSTÈME] {subject}",
        'emails/system_alert.html',
        context,
        list(superadmins)
    )

def send_audience_report(user, station, report_data):
    """
    Envoie le rapport d'audience hebdomadaire.
    """
    context = {
        'user': user,
        'station': station,
        'data': report_data,
    }
    return send_centralized_email(
        f"Rapport d'audience hebdomadaire - {station.name}",
        'emails/audience_report.html',
        context,
        [user.email]
    )
