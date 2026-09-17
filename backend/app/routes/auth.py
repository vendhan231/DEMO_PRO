from datetime import timedelta, datetime
from flask import Blueprint, request, jsonify, current_app, url_for
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from .. import db
from ..models import User
from ..mongo_service import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    serialize_user,
    verify_password,
    update_user_verification,
    verify_user_token as mongo_verify_user_token,
    set_user_email_verified as mongo_set_email_verified,
)
from ..services.email_service import send_verification_email, send_welcome_email, can_resend_verification, generate_verification_token, VERIFICATION_TOKEN_EXPIRY_HOURS
from datetime import timedelta as td

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    frontend_url = data.get("frontend_url")
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm = data.get("confirm_password", "")

    import re as regex_module
    email_pattern = regex_module.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    if not email_pattern.match(email):
        return jsonify({"error": "Please enter a valid email address"}), 400

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if password != confirm:
        return jsonify({"error": "Passwords do not match"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if current_app.config.get("USE_MONGO"):
        if get_user_by_email(email):
            return jsonify({"error": "Email already registered"}), 409
        user = create_user(name=name, email=email, password=password)
        from ..services.email_service import send_email_smtp, render_verification_email
        token = generate_verification_token()
        expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRY_HOURS)
        update_user_verification(email, token, expires)
        html = render_verification_email(name, token, frontend_url)
        send_email_smtp(user.get("email"), "Verify Your Email - BookVerse", html, "")
        return jsonify({
            "message": "Registration successful! Please check your email and verify your account.",
            "requires_verification": True,
        }), 201

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=name, email=email)
    user.set_password(password)
    user.email_verified = False

    db.session.add(user)
    db.session.commit()

    send_verification_email(user, frontend_url)

    return jsonify({
        "message": "Registration successful! Please check your email and verify your account.",
        "requires_verification": True,
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if current_app.config.get("USE_MONGO"):
        user = get_user_by_email(email)
        if not user or not verify_password(user, password):
            return jsonify({"error": "Invalid email or password"}), 401
        user["email_verified"] = user.get("email_verified", False)
        access_token = create_access_token(identity=str(user["id"]), expires_delta=timedelta(days=1))
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "email_verified": user["email_verified"],
            "user": serialize_user(user),
        }), 200

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=1))

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "email_verified": user.email_verified,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Logout successful"}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    if current_app.config.get("USE_MONGO"):
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": serialize_user(user)}), 200

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/verify-email/<token>", methods=["GET"])
def verify_email(token):
    if current_app.config.get("USE_MONGO"):
        user = mongo_verify_user_token(token)
        if not user:
            return jsonify({"error": "Invalid verification token"}), 400
        if user.get("verification_token_expires") and user["verification_token_expires"] < datetime.utcnow():
            return jsonify({"error": "Verification token has expired"}), 400
        if user.get("email_verified"):
            return jsonify({"message": "Email already verified"}), 200
        mongo_set_email_verified(user["id"])
        send_welcome_email_user_mongo(user)
        return jsonify({
            "message": "Your email has been verified successfully. Welcome to BookVerse!",
            "email_verified": True,
        }), 200

    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return jsonify({"error": "Invalid verification token"}), 400

    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        return jsonify({"error": "Verification token has expired"}), 400

    if user.email_verified:
        return jsonify({"message": "Email already verified"}), 200

    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.session.commit()

    send_welcome_email(user)

    return jsonify({
        "message": "Your email has been verified successfully. Welcome to BookVerse!",
        "email_verified": True,
    }), 200


def send_welcome_email_user_mongo(user_doc):
    from ..services.email_service import send_email_smtp, render_welcome_email
    html = render_welcome_email(user_doc.get("name", ""))
    send_email_smtp(user_doc.get("email"), "Welcome to BookVerse!", html, "")


@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    frontend_url = data.get("frontend_url")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    if current_app.config.get("USE_MONGO"):
        user = get_user_by_email(email)
        if not user:
            return jsonify({"message": "If the email is registered, a verification email has been sent."}), 200
        if user.get("email_verified"):
            return jsonify({"message": "This account has already been verified. Please log in."}), 200
        can_resend, msg = can_resend_verification_mongo(user)
        if not can_resend:
            return jsonify({"error": msg}), 429
        token = generate_verification_token()
        expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRY_HOURS)
        update_user_verification(email, token, expires)
        html = render_welcome_email_placeholder(user.get("name", ""), token, frontend_url)
        send_email_smtp_user_mongo(user.get("email"), "Verify Your Email - BookVerse", html, "")
        return jsonify({"message": "Verification email sent. Please check your email."}), 200

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "If the email is registered, a verification email has been sent."}), 200

    if user.email_verified:
        return jsonify({"message": "This account has already been verified. Please log in."}), 200

    can_resend, msg = can_resend_verification(user)
    if not can_resend:
        return jsonify({"error": msg}), 429

    send_verification_email(user, frontend_url)
    return jsonify({"message": "Verification email sent. Please check your email."}), 200


def can_resend_verification_mongo(user_doc):
    sent_at = user_doc.get("verification_sent_at")
    if not sent_at:
        return True, ""
    if isinstance(sent_at, str):
        return True, ""
    from ..services.email_service import RESEND_COOLDOWN_MINUTES
    remaining = timedelta(minutes=RESEND_COOLDOWN_MINUTES) - (datetime.utcnow() - sent_at)
    if remaining.total_seconds() <= 0:
        return True, ""
    mins = remaining.total_seconds() / 60
    return False, f"Please wait {int(mins) + 1} minutes before requesting a new verification email."


def send_email_smtp_user_mongo(to_email, subject, html_content, text_content=None):
    from ..services.email_service import send_email_smtp, save_email_to_file, BOOKSTORE_NAME
    host = current_app.config.get("EMAIL_HOST")
    if not host:
        save_email_to_file(to_email, subject, html_content)
        return False
    return send_email_smtp(to_email, subject, html_content, text_content)


def render_welcome_email_placeholder(name, token, frontend_url=None):
    from ..services.email_service import render_verification_email
    return render_verification_email(name, token, frontend_url)
