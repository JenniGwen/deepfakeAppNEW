from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os
import datetime

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