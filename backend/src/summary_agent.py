from flask import request, jsonify, Blueprint
from accessories import get_mongo_db, init_gemini
from datetime import datetime
import uuid

summary_agent_bp = Blueprint('summary_agent', __name__)

@summary_agent_bp.route('/generate/<material_id>', methods=['POST', 'OPTIONS'])
def generate_summary(material_id):
    if request.method == 'OPTIONS':
        return '', 204

    try:
        db = get_mongo_db()
        material = db.materials.find_one({"_id": material_id})
        if not material:
            return jsonify({"error": "找不到教材"}), 404

        analysis = material.get('analysis')
        if not analysis:
            return jsonify({"error": "請先進行 AI 分析"}), 400

        model = init_gemini()
        if not model:
            return jsonify({"error": "AI 服務未初始化"}), 500

        key_concepts = analysis.get('key_concepts', [])
        concepts_text = "\n".join([f"- {c['name']}: {c['description']}" for c in key_concepts])

        prompt = f"""
你是整理筆記的 AI（Summary Agent）。請根據以下教材資訊，產生結構化學習重點筆記。

教材主題：{analysis.get('title', '')}
學科：{analysis.get('subject', '')}
難度：{analysis.get('difficulty', '')}
核心概念：
{concepts_text}

請產生 Markdown 格式筆記，包含：
1. 學習目標
2. 核心概念（每個附說明與例子）
3. 重點整理
4. 常見錯誤或注意事項
5. 複習建議

請直接回傳 Markdown。
"""
        response = model.generate_content(prompt)
        markdown_content = response.text.strip()

        summary_id = str(uuid.uuid4())
        db.summaries.insert_one({
            "_id": summary_id,
            "id": summary_id,
            "material_id": material_id,
            "user_email": material.get('user_email', ''),
            "content": markdown_content,
            "created_at": datetime.now().isoformat()
        })

        db.materials.update_one(
            {"_id": material_id},
            {"$set": {"status": "done", "has_summary": True}}
        )

        # 記錄到 MySQL output_files
        try:
            from models import OutputFile, LearningProgress
            from accessories import sqldb
            from flask import current_app
            with current_app.app_context():
                output = OutputFile(
                    material_id=material_id,
                    user_email=material.get('user_email', ''),
                    output_type='summary',
                    mongo_id=summary_id,
                    status='done'
                )
                sqldb.session.add(output)

                progress = LearningProgress.query.filter_by(
                    user_email=material.get('user_email', ''),
                    material_id=material_id
                ).first()
                if progress:
                    progress.has_summary = True
                sqldb.session.commit()
        except Exception as e:
            print(f"MySQL 更新失敗（非致命）: {e}")

        return jsonify({
            "message": "重點筆記生成完成",
            "summary_id": summary_id,
            "content": markdown_content
        }), 200

    except Exception as e:
        return jsonify({"error": f"筆記生成失敗: {str(e)}"}), 500

@summary_agent_bp.route('/get/<material_id>', methods=['GET'])
def get_summary(material_id):
    try:
        db = get_mongo_db()
        summary = db.summaries.find_one({"material_id": material_id})
        if not summary:
            return jsonify({"error": "尚未生成筆記"}), 404
        summary.pop('_id', None)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
