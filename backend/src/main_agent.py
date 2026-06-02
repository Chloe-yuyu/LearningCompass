from flask import request, jsonify, Blueprint
from accessories import get_mongo_db, get_gridfs, init_gemini
from datetime import datetime
from bson.objectid import ObjectId
import tempfile
import os

main_agent_bp = Blueprint('main_agent', __name__)

def extract_text_from_file(file_path: str) -> str:
    ext = file_path.rsplit('.', 1)[-1].lower()
    if ext in ['txt', 'md']:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    elif ext == 'pdf':
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            return text
        except:
            return ""
    elif ext == 'docx':
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs])
        except:
            return ""
    return ""

@main_agent_bp.route('/analyze/<material_id>', methods=['POST', 'OPTIONS'])
def analyze_material(material_id):
    if request.method == 'OPTIONS':
        return '', 204

    try:
        db = get_mongo_db()
        material = db.materials.find_one({"_id": material_id})
        if not material:
            return jsonify({"error": "找不到教材"}), 404

        grid_id = material.get('grid_id')
        save_filename = material.get('save_filename', 'file.txt')

        # 從 GridFS 讀取檔案
        fs = get_gridfs()
        grid_file = fs.get(ObjectId(grid_id))
        ext = os.path.splitext(save_filename)[1]

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(grid_file.read())
            tmp_path = tmp.name

        raw_text = extract_text_from_file(tmp_path)
        os.unlink(tmp_path)

        if not raw_text:
            return jsonify({"error": "無法讀取教材內容"}), 400

        model = init_gemini()
        if not model:
            return jsonify({"error": "AI 服務未初始化"}), 500

        prompt = f"""
你是一個教育 AI 助理（Main Agent）。請分析以下教材內容，萃取出核心知識點。

請以 JSON 格式回傳，包含：
- title: 教材標題（字串）
- subject: 學科領域（字串）
- key_concepts: 核心概念列表（陣列，每項包含 name 和 description）
- summary: 教材整體摘要（200字以內）
- difficulty: 難度評估（初級/中級/高級）

教材內容：
{raw_text[:8000]}

請只回傳 JSON，不要有其他文字。
"""
        response = model.generate_content(prompt)
        import json, re
        text = re.sub(r'```json|```', '', response.text.strip()).strip()
        result = json.loads(text)

        db.materials.update_one(
            {"_id": material_id},
            {"$set": {
                "analysis": result,
                "status": "analyzed",
                "analyzed_at": datetime.now().isoformat()
            }}
        )

        # 更新 MySQL 學習進度
        try:
            from models import LearningProgress
            from accessories import sqldb
            from flask import current_app
            with current_app.app_context():
                progress = LearningProgress.query.filter_by(
                    user_email=material['user_email'],
                    material_id=material_id
                ).first()
                if not progress:
                    progress = LearningProgress(
                        user_email=material['user_email'],
                        material_id=material_id
                    )
                    sqldb.session.add(progress)
                progress.has_analyzed = True
                sqldb.session.commit()
        except Exception as e:
            print(f"MySQL 更新失敗（非致命）: {e}")

        return jsonify({
            "message": "教材分析完成",
            "material_id": material_id,
            "analysis": result
        }), 200

    except Exception as e:
        return jsonify({"error": f"分析失敗: {str(e)}"}), 500

@main_agent_bp.route('/status/<material_id>', methods=['GET'])
def get_analysis_status(material_id):
    try:
        db = get_mongo_db()
        material = db.materials.find_one({"_id": material_id})
        if not material:
            return jsonify({"error": "找不到教材"}), 404
        material.pop('_id', None)
        material.pop('grid_id', None)
        return jsonify(material), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
