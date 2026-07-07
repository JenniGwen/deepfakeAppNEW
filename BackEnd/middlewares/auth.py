# File: BackEnd/app/middlewares/auth.py

from functools import wraps
from flask import request
import jwt
import os

from core.response_json import error_response


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return error_response("Token akses tidak ditemukan! Silakan login.", status_code=401)

        try:
            secret_key = os.getenv("JWT_SECRET")
            decoded_data = jwt.decode(token, secret_key, algorithms=["HS256"])

            current_user = decoded_data

        except jwt.ExpiredSignatureError:
            return error_response("Token sudah kedaluwarsa! Silakan login ulang.", status_code=401)
        except jwt.InvalidTokenError:
            return error_response("Token tidak valid!", status_code=401)

        return f(current_user, *args, **kwargs)

    return decorated



def token_optional(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None

        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    secret_key = os.getenv("JWT_SECRET")
                    # Jika berhasil decode, masukkan ke current_user
                    current_user = jwt.decode(token, secret_key, algorithms=["HS256"])
                except Exception:
                    # Abaikan error (expired/invalid), tetap izinkan masuk sebagai Guest
                    pass

        return f(current_user, *args, **kwargs)

    return decorated