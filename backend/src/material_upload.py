from flask import request, jsonify, Blueprint
from accessories import get_mongo_db, get_gridfs
from datetime import datetime
from bson.objectid import ObjectId
import uuid

material_bp = Blueprint('material', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'md'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@material_bp.route('/upload', methods=['POST', 'OPTIONS'])
def upload_material():
    if request.method == 'OPTIONS':
        return '', 204

    if 'file' not in request.files:
        return jsonify({"error": "未選擇檔案"}), 400

    file = request.files['file']
    user_email = request.form.get('user_email', 'anonymous')

    if file.filename == '':
        return jsonify({"error": "未選擇檔案"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "不支援的檔案格式"}), 400

    try:
        file_id = str(uuid.uuid4())
        ext = file.filename.rsplit('.', 1)[1].lower()
        save_filename = f"{file_id}.{ext}"

        # 存到 GridFS
        fs = get_gridfs()
        file_data = file.read()
        grid_id = fs.put(
            file_data,
            filename=save_filename,
            content_type=file.content_type,
            metadata={"material_id": file_id, "user_email": user_email}
        )

        # 存資訊到 MongoDB
        db = get_mongo_db()
        material_doc = {
            "_id": file_id,
            "id": file_id,
            "original_filename": file.filename,
            "save_filename": save_filename,
            "grid_id": str(grid_id),
            "user_email": user_email,
            "status": "uploaded",
            "created_at": datetime.now().isoformat()
        }
        db.materials.insert_one(material_doc)

        return jsonify({
            "message": "教材上傳成功",
            "material_id": file_id,
            "filename": file.filename
        }), 200

    except Exception as e:
        return jsonify({"error": f"上傳失敗: {str(e)}"}), 500

@material_bp.route('/list', methods=['GET'])
def list_materials():
    user_email = request.args.get('user_email', '')
    if not user_email:
        return jsonify({"error": "未提供使用者 Email"}), 400

    try:
        db = get_mongo_db()
        materials = list(db.materials.find({"user_email": user_email}))
        for m in materials:
            m.pop('_id', None)
            m.pop('grid_id', None)
        return jsonify({"materials": materials}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@material_bp.route('/delete/<material_id>', methods=['DELETE', 'OPTIONS'])
def delete_material(material_id):
    if request.method == 'OPTIONS':
        return '', 204

    try:
        db = get_mongo_db()
        material = db.materials.find_one({"_id": material_id})
        if not material:
            return jsonify({"error": "找不到教材"}), 404

        # 刪除 GridFS 檔案
        grid_id = material.get('grid_id')
        if grid_id:
            fs = get_gridfs()
            try:
                fs.delete(ObjectId(grid_id))
            except:
                pass

        db.materials.delete_one({"_id": material_id})
        return jsonify({"message": "教材已刪除"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
