from core.db_connector import get_db
from core.response_json import success_response, server_error_response


def test_connection():
    try:
        db = get_db()
        response = db.table("users").select("id").limit(1).execute()
        return success_response(
            message="Database connection successful!",
            data={
                "connection": "OK",
                "test_query_data": response.data  # Akan mengembalikan [] jika tabel masih kosong
            },
            status_code=200
        )

    except Exception as e:
        return server_error_response(error_details=str(e))