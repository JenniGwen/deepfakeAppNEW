
from flask import request
import numpy as np
import traceback

from core.response_json import error_response, success_response, server_error_response
from middlewares.auth import token_optional
from services.analysis_service import run_deepfake_analysis, save_scan_history


@token_optional
def scan_image(current_user):
    if 'file' not in request.files:
        return error_response(message="No file uploaded", status_code=400)

    file = request.files['file']

    if file.filename == '':
        return error_response(message="No selected file", status_code=400)

    try:
        file_bytes = np.frombuffer(file.read(), np.uint8)

        analysis_result = run_deepfake_analysis(file_bytes)

        if current_user is not None:
            save_scan_history(
                user_id=current_user.get("user_id"),
                file_name=file.filename,
                result=analysis_result["result"],
                confidence_score=analysis_result["probability"],
                processing_time=analysis_result["processing_time"]
            )
            analysis_result["saved_to_history"] = True
        else:
            analysis_result["saved_to_history"] = False

        return success_response(
            message="Analysis complete",
            data=analysis_result
        )

    except ValueError as ve:
        return error_response(message=str(ve), status_code=400)
    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()
        return server_error_response(error_details=str(e))