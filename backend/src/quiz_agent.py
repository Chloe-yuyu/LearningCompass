from flask import request, jsonify, Blueprint
from accessories import get_mongo_db, init_gemini
from datetime import datetime
import uuid

quiz_agent_bp = Blueprint('quiz_agent', __name__)

@quiz_agent_bp.route('/generate/<material_id>', methods=['POST', 'OPTIONS'])
def generate_quiz(material_id):
    if request.method == 'OPTIONS':
        return '', 204

    data = request.json or {}
    question_count = data.get('count', 5)
    question_types = data.get('types', ['single_choice', 'short_answer'])

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
你是一個出題 AI（Quiz Agent）。請根據以下知識點，生成 {question_count} 道練習題。
題型：{', '.join(question_types)}
知識點：
{concepts_text}

請以 JSON 陣列格式回傳，每題包含：
- type, question, options（單選題）, answer, explanation
只回傳 JSON 陣列。
"""
        response = model.generate_content(prompt)
        import json, re
        text = re.sub(r'```json|```', '', response.text.strip()).strip()
        questions = json.loads(text)

        quiz_id = str(uuid.uuid4())
        db.quizzes.insert_one({
            "_id": quiz_id,
            "id": quiz_id,
            "material_id": material_id,
            "user_email": material.get('user_email', ''),
            "questions": questions,
            "created_at": datetime.now().isoformat()
        })

        # 記錄到 MySQL output_files
        try:
            from models import OutputFile, LearningProgress
            from accessories import sqldb
            from flask import current_app
            with current_app.app_context():
                output = OutputFile(
                    material_id=material_id,
                    user_email=material.get('user_email', ''),
                    output_type='quiz',
                    mongo_id=quiz_id,
                    status='done'
                )
                sqldb.session.add(output)

                progress = LearningProgress.query.filter_by(
                    user_email=material.get('user_email', ''),
                    material_id=material_id
                ).first()
                if progress:
                    progress.has_quiz = True
                sqldb.session.commit()
        except Exception as e:
            print(f"MySQL 更新失敗（非致命）: {e}")

        return jsonify({
            "message": "題目生成完成",
            "quiz_id": quiz_id,
            "questions": questions
        }), 200

    except Exception as e:
        return jsonify({"error": f"出題失敗: {str(e)}"}), 500

@quiz_agent_bp.route('/list/<material_id>', methods=['GET'])
def list_quizzes(material_id):
    try:
        db = get_mongo_db()
        quizzes = list(db.quizzes.find({"material_id": material_id}))
        for q in quizzes:
            q.pop('_id', None)
        return jsonify({"quizzes": quizzes}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
