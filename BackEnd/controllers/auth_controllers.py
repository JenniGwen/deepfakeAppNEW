# File: BackEnd/app/controllers/auth_controllers.py

from flask import request

from core.response_json import error_response, success_response, server_error_response
from middlewares.auth import token_required
from services.auth_service import register_new_user, authenticate_user, google_login_or_register


def register():
    try:
        data = request.get_json()

        if not data or not data.get("email") or not data.get("username") or not data.get("password"):
            return error_response("Email, username, dan password wajib diisi!", status_code=400)

        user_data = register_new_user(
            email=data.get("email"),
            username=data.get("username"),
            password=data.get("password"),
            display_name=data.get("display_name")
        )

        return success_response(message="Registrasi berhasil!", data=user_data, status_code=201)

    except ValueError as ve:
        return error_response(message=str(ve), status_code=409)
    except Exception as e:
        return server_error_response(error_details=str(e))


def login():
    try:
        data = request.get_json()

        if not data or not data.get("email") or not data.get("password"):
            return error_response("Email dan password wajib diisi!", status_code=400)

        auth_data = authenticate_user(
            email=data.get("email"),
            password=data.get("password")
        )

        return success_response(message="Login berhasil!", data=auth_data, status_code=200)

    except ValueError as ve:
        return error_response(message=str(ve), status_code=401)
    except Exception as e:
        return server_error_response(error_details=str(e))


def google_auth():
    try:
        data = request.get_json()

        if not data or not data.get("email"):
            return error_response("Email wajib diisi!", status_code=400)

        auth_data = google_login_or_register(
            email=data.get("email"),
            display_name=data.get("display_name")
        )

        return success_response(message="Google login berhasil!", data=auth_data, status_code=200)

    except Exception as e:
        return server_error_response(error_details=str(e))


@token_required
def logout(current_user):
    try:
        email_user = current_user.get('email')

        return success_response(
            message=f"Logout berhasil untuk {email_user}. Silakan hapus token di sisi Frontend.",
            status_code=200
        )
    except Exception as e:
        return server_error_response(error_details=str(e))