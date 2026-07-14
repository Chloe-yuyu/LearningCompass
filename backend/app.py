from flask import Flask, jsonify, request
import os
from accessories import sqldb, mail, redis_client, login_manager, init_mongodb
from config import DevelopmentConfig
from models import OutputFile, QuizResult, LearningProgress

# Blueprint imports
from src.login import login_bp
from src.register import register_bp
from src.material_upload import material_bp
from src.chat_agent import chat_agent_bp
from agents.routes import sdk_agent_bp
from agents.material_routes import material_agent_new_bp

app = Flask(__name__, static_folder=None)
app.config.from_object(DevelopmentConfig())

def is_allowed_origin(origin):
    if not origin:
        return False
    if origin.startswith('http://localhost:'):
        return True
    return False

@app.after_request
def handle_cors(response):
    origin = request.headers.get('Origin', '')
    if is_allowed_origin(origin):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE, PATCH'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    if request.method == 'OPTIONS':
        response.status_code = 200
    return response

# 初始化資料庫
init_mongodb()
sqldb.init_app(app)
mail.init_app(app)
redis_client.init_app(app)
login_manager.init_app(app)

# 註冊 Blueprint
app.register_blueprint(login_bp,              url_prefix='/login')
app.register_blueprint(register_bp,           url_prefix='/register')
app.register_blueprint(material_bp,           url_prefix='/material')
app.register_blueprint(material_agent_new_bp, url_prefix='/material-agent')
app.register_blueprint(chat_agent_bp,         url_prefix='/chat')
app.register_blueprint(sdk_agent_bp)          # /sdk-agent/ask + /sdk-agent/history

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Learning Compass Backend 運行中'})

with app.app_context():
    sqldb.create_all()
    print("✅ MySQL 資料表初始化完成")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
