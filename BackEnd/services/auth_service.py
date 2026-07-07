from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os
import datetime
import re

from core.db_connector import get_db
from models.user import User


def register_new_user(email, username, password, display_name):
    db = get_db()

    cek_email = db.table("users").select("id").eq("email", email).execute()
    if len(cek_email.data) > 0:
        raise ValueError("Email sudah digunakan!")

    cek_username = db.table("users").select("id").eq("username", username).execute()
    if len(cek_username.data) > 0:
        raise ValueError("Username sudah digunakan!")

    hashed_password = generate_password_hash(password)
    new_user_data = {
        "email": email,
        "username": username,
        "password_hash": hashed_password,
        "display_name": display_name
    }

    response = db.table("users").insert(new_user_data).execute()

    user_obj = User.from_dict(response.data[0])
    return user_obj.to_dict()


def authenticate_user(email, password):
    db = get_db()

    response = db.table("users").select("*").eq("email", email).execute()
    if len(response.data) == 0:
        raise ValueError("Email atau password salah!")

    user_data = response.data[0]

    if not check_password_hash(user_data["password_hash"], password):
        raise ValueError("Email atau password salah!")

    secret_key = os.getenv("JWT_SECRET")
    token_payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }

    token = jwt.encode(token_payload, secret_key, algorithm="HS256")

    user_obj = User.from_dict(user_data)
    return {
        "access_token": token,
        "user": user_obj.to_dict()
    }


def _generate_jwt(user_data):
    secret_key = os.getenv("JWT_SECRET")
    token_payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "role": user_data.get("role", "user"),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(token_payload, secret_key, algorithm="HS256")


def _unique_username(base_username, db):
    """Generate a unique username by appending a number if needed."""
    # Sanitize: only keep alphanumeric and underscores
    candidate = re.sub(r'[^a-z0-9_]', '', base_username.lower())[:20] or "user"
    existing = db.table("users").select("id").eq("username", candidate).execute()
    if len(existing.data) == 0:
        return candidate
    # Append suffix until unique
    suffix = 1
    while True:
        new_candidate = f"{candidate}{suffix}"
        check = db.table("users").select("id").eq("username", new_candidate).execute()
        if len(check.data) == 0:
            return new_candidate
        suffix += 1


def google_login_or_register(email, display_name):
    """
    Find existing user by email or create a new one (no password).
    Returns the same user for both email/password and Google OAuth logins.
    """
    db = get_db()

    # Try to find existing user by email
    response = db.table("users").select("*").eq("email", email).execute()

    if len(response.data) > 0:
        # User already exists — return their existing account
        user_data = response.data[0]
    else:
        # New Google user — create account without password
        base_username = email.split("@")[0]
        username = _unique_username(base_username, db)
        new_user_data = {
            "email": email,
            "username": username,
            "display_name": display_name or username,
            "password_hash": None,
        }
        insert_response = db.table("users").insert(new_user_data).execute()
        user_data = insert_response.data[0]

    token = _generate_jwt(user_data)
    user_obj = User.from_dict(user_data)
    return {
        "access_token": token,
        "user": user_obj.to_dict()
    }