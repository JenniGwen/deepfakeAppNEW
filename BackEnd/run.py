# File: BackEnd/run.py

from flask import Flask
from flask_cors import CORS

from controllers.analysis_controllers import scan_image
from controllers.auth_controllers import register, login, logout
from controllers.daily_statistic_controllers import get_stats, show_all_data
from controllers.test_controllers import test_connection
from core.response_json import success_response
from middlewares.auth import token_required

app = Flask(__name__)
CORS(app)

# --- PUBLIC ROUTES ---
app.add_url_rule('/api/test-db', view_func=test_connection, methods=['GET'])
app.add_url_rule('/api/register', view_func=register, methods=['POST'])
app.add_url_rule('/api/login', view_func=login, methods=['POST'])
app.add_url_rule('/api/logout', view_func=logout, methods=['POST'])

app.add_url_rule('/api/statistics/summary', view_func=get_stats, methods=['GET'])
app.add_url_rule('/api/statistics/history', view_func=show_all_data, methods=['GET'])
app.add_url_rule('/api/scan', view_func=scan_image, methods=['POST'])

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return success_response(
        message="Selamat datang di area privat!",
        data={"user_aktif": current_user}
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)