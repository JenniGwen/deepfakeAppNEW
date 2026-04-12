
from flask import jsonify


def success_response(message="Success", data=None, status_code=200):
    response = {
        "status": "success",
        "message": message
    }
    if data is not None:
        response["data"] = data

    return jsonify(response), status_code


def error_response(message="An error occurred", error_details=None, status_code=400):
    response = {
        "status": "error",
        "message": message
    }
    if error_details is not None:
        response["details"] = error_details

    return jsonify(response), status_code


def server_error_response(error_details=None):
    response = {
        "status": "fail",
        "message": "Internal server error"
    }
    if error_details is not None:
        response["details"] = str(error_details)

    return jsonify(response), 500