# File: BackEnd/run.py

from flask import Flask, request, Response
from flask_cors import CORS

from controllers.analysis_controllers import scan_image
from controllers.auth_controllers import register, login, logout, google_auth
from controllers.daily_statistic_controllers import get_stats, show_all_data
from controllers.test_controllers import test_connection
from core.response_json import success_response
from middlewares.auth import token_required

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=False)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = Response()
        res.headers["Access-Control-Allow-Origin"] = "*"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        res.headers["Access-Control-Max-Age"] = "86400"
        return res, 200

# --- PUBLIC ROUTES ---
@app.route('/', methods=['GET'])
def health_check():
    from flask import jsonify
    return jsonify({
        "status": "online",
        "message": "SynthScan Neural Engine is awake and ready (Modular)!",
        "version": "3.1"
    }), 200

app.add_url_rule('/api/test-db', view_func=test_connection, methods=['GET'])
app.add_url_rule('/api/register', view_func=register, methods=['POST'])
app.add_url_rule('/api/login', view_func=login, methods=['POST'])
app.add_url_rule('/api/logout', view_func=logout, methods=['POST'])
app.add_url_rule('/api/auth/google', view_func=google_auth, methods=['POST'])

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
    app.run(host="0.0.0.0", port=7860)