from flask import request, jsonify, Blueprint
from werkzeug.security import generate_password_hash
from accessories import get_mongo_db
import uuid
from datetime import datetime

register_bp = Blueprint('register', __name__)

@register_bp.route('/register_user', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({"error": "請填寫所有欄位"}), 400

    try:
        db = get_mongo_db()
        if db.users.find_one({"email": email}):
            return jsonify({"error": "此 Email 已被註冊"}), 409

        user_id = str(uuid.uuid4())
        db.users.insert_one({
            "_id": user_id,
            "id": user_id,
            "name": name,
            "password": generate_password_hash(password),
            "email": email,
            "created_at": datetime.now().isoformat()
        })

        return jsonify({"message": "註冊成功！請直接登入。"}), 200

    except Exception as e:
        return jsonify({"error": f"註冊失敗: {str(e)}"}), 500

@register_bp.route('/update_profile', methods=['POST', 'OPTIONS'])
def update_profile():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"error": "未提供 Email"}), 400

    try:
        db = get_mongo_db()
        db.users.update_one(
            {"email": email},
            {"$set": {
                "name": data.get('name', ''),
                "school": data.get('school', ''),
                "department": data.get('department', ''),
                "bio": data.get('bio', ''),
                "updated_at": datetime.now().isoformat()
            }}
        )
        return jsonify({"message": "資料已更新"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
