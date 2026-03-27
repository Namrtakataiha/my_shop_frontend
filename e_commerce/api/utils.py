
import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404


def generate_otp():
    return str(random.randint(100000, 999999))


def send_email(subject, message, recipient_email):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


def check_permission(user, required_role):
    if not user or not user.is_authenticated:
        return False
    return user.role == required_role


def is_admin(user):
    if not user or not user.is_authenticated:
        return False
    if user.role == 'admin' or user.is_admin:
        return True
    return False
    

def is_user(user):
    if not user or not user.is_authenticated:
        return False
    if user.role == 'user' and not user.is_admin:
        return True
    return False


