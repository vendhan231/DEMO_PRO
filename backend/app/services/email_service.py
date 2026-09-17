import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from flask import current_app
from ..models import User
from .. import db
import secrets

BOOKSTORE_NAME = "BookVerse"
VERIFICATION_TOKEN_EXPIRY_HOURS = 24
RESEND_COOLDOWN_MINUTES = 5


def generate_verification_token():
    return secrets.token_urlsafe(32)


def send_email_smtp(to_email, subject, html_content, text_content=None):
    host = current_app.config.get("EMAIL_HOST")
    port = current_app.config.get("EMAIL_PORT", 587)
    username = current_app.config.get("EMAIL_USER")
    password = current_app.config.get("EMAIL_PASSWORD")
    from_email = current_app.config.get("EMAIL_FROM", username)

    if not host or not username or not password:
        save_email_to_file(to_email, subject, html_content)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email
        text_part = text_content or "Please view this email in an HTML-capable client."
        msg.attach(MIMEText(text_part, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        context = ssl.create_default_context()
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, context=context, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            server.starttls(context=context)
        server.login(username, password)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        current_app.logger.error(f"SMTP send failed: {e}")
        save_email_to_file(to_email, subject, html_content)
        return False


def save_email_to_file(to_email, subject, html_content):
    emails_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "emails")
    os.makedirs(emails_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"{to_email}_{timestamp}.html"
    safe_filename = "".join(c if c.isalnum() or c in "._-" else "_" for c in filename)
    filepath = os.path.join(emails_dir, safe_filename)
    with open(filepath, "w") as f:
        f.write(f"To: {to_email}\nSubject: {subject}\n\n{html_content}")
    current_app.logger.info(f"Email saved to {filepath} (SMTP not configured)")


def render_verification_email(to_name, token, frontend_url=None):
    frontend_url = (frontend_url or current_app.config.get("FRONTEND_URL", "http://localhost:5173")).rstrip("/")
    verify_url = f"{frontend_url}/verify-email/{token}"
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Welcome to BookVerse - Verify Your Email</title></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #E8722C, #CC5500); padding: 40px; text-align: center;">
      <span style="font-size: 48px;">📚</span>
      <h1 style="color: #fff; font-size: 28px; margin: 10px 0 0; font-family: Georgia, serif; font-weight: bold;">BookVerse</h1>
      <p style="color: #fff; font-size: 14px; opacity: 0.9; margin: 0;">Online Bookstore</p>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #1A1A2E; font-size: 22px; margin: 0 0 20px; font-family: Georgia, serif;">Welcome to BookVerse, {to_name}!</h2>
      <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Thank you for creating your account. Please verify your email address by clicking the button below.
        This link will expire in 24 hours.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{verify_url}" style="display: inline-block; background: #E8722C; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; font-size: 16px;">
          Verify My Email
        </a>
      </div>
      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        If the button above doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="color: #999; font-size: 12px; word-break: break-all; margin: 0;">
        {verify_url}
      </p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          BookVerse Online Bookstore. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""


def render_welcome_email(to_name, frontend_url=None):
    frontend_url = (frontend_url or current_app.config.get("FRONTEND_URL", "http://localhost:5173")).rstrip("/")
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Welcome to BookVerse!</title></head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #4CAF50, #2E9E5B); padding: 40px; text-align: center;">
      <span style="font-size: 48px;">🎉</span>
      <h1 style="color: #fff; font-size: 28px; margin: 10px 0 0; font-family: Georgia, serif; font-weight: bold;">Welcome to BookVerse!</h1>
      <p style="color: #fff; font-size: 14px; opacity: 0.9; margin: 0;">Online Bookstore</p>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #1A1A2E; font-size: 22px; margin: 0 0 20px; font-family: Georgia, serif;">Your email is now verified, {to_name}!</h2>
      <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Your account is now active and verified. You can:
      </p>
      <ul style="color: #444; font-size: 16px; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
        <li>Browse our entire bookstore</li>
        <li>Add books to your shopping cart</li>
        <li>Upload and share your own books</li>
        <li>Place orders with demo checkout</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{frontend_url}/books" style="display: inline-block; background: #E8722C; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; font-size: 16px;">
          Visit BookVerse
        </a>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          BookVerse Online Bookstore. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""


def send_verification_email(user, frontend_url=None):
    token = generate_verification_token()
    expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRY_HOURS)
    user.verification_token = token
    user.verification_token_expires = expires
    user.verification_sent_at = datetime.utcnow()
    db.session.commit()

    html = render_verification_email(user.name, token, frontend_url)
    text = f"Welcome to BookVerse! Please verify your email by visiting: {frontend_url or current_app.config.get('FRONTEND_URL', 'http://localhost:5173').rstrip('/')}/verify-email/{token}"
    send_email_smtp(user.email, f"Verify Your Email - {BOOKSTORE_NAME}", html, text)
    return token


def send_welcome_email(user):
    html = render_welcome_email(user.name)
    text = f"Welcome to BookVerse, {user.name}! Your email has been verified and your account is now active."
    send_email_smtp(user.email, f"Welcome to {BOOKSTORE_NAME}!", html, text)


def can_resend_verification(user):
    if not user.verification_sent_at:
        return True, ""
    elapsed = datetime.utcnow() - user.verification_sent_at
    remaining = timedelta(minutes=RESEND_COOLDOWN_MINUTES) - elapsed
    if remaining.total_seconds() <= 0:
        return True, ""
    mins = remaining.total_seconds() / 60
    return False, f"Please wait {int(mins) + 1} minutes before requesting a new verification email."
