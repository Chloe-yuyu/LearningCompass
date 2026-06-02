from flask import request, jsonify, Blueprint, current_app
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta
import jwt
from accessories import get_mongo_db

login_bp = Blueprint('login', __name__)

@login_bp.route('/login_user', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        db = get_mongo_db()
        user_data = db.users.find_one({"email": email})

        if user_data and check_password_hash(user_data['password'], password):
            exp_time = datetime.now() + timedelta(hours=3)
            token = jwt.encode({
                'user': email,
                'exp': int(exp_time.timestamp())
            }, current_app.config['SECRET_KEY'], algorithm='HS256')

            return jsonify({
                'token': token,
                'name': user_data.get('name', ''),
                'email': email
            }), 200
        else:
            return jsonify({'message': '帳號或密碼不正確'}), 401

    except Exception as e:
        return jsonify({'message': f'登入失敗: {str(e)}'}), 500

@login_bp.route('/logout', methods=['OPTIONS', 'POST'])
def logout():
    return jsonify({'message': '登出成功'}), 200
