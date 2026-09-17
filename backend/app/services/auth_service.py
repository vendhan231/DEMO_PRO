from .. import db
from ..models import User
from werkzeug.security import generate_password_hash


def create_user(name, email, password, role="customer"):
    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


def get_user_by_email(email):
    return User.query.filter_by(email=email).first()


def get_user_by_id(user_id):
    return User.query.get(user_id)


def authenticate_user(email, password):
    user = get_user_by_email(email)
    if user and user.check_password(password):
        return user
    return None
