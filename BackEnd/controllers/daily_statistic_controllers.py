# File: BackEnd/app/controllers/daily_statistic_controllers.py

from flask import request

from core.response_json import success_response, server_error_response
from middlewares.auth import token_required
from services.statistic_service import get_dashboard_stats, get_paginated_scans


@token_required
def get_stats(current_user):
    try:
        user_id = current_user.get('user_id')
        stats = get_dashboard_stats(user_id)
        return success_response(message="Statistik berhasil diambil", data=stats)
    except Exception as e:
        return server_error_response(error_details=str(e))


@token_required
def show_all_data(current_user):
    try:
        user_id = current_user.get('user_id')

        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))

        data = get_paginated_scans(user_id, page, limit)
        return success_response(message="Riwayat scan berhasil diambil", data=data)
    except Exception as e:
        return server_error_response(error_details=str(e))