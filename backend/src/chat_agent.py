from flask import request, jsonify, Blueprint
from accessories import get_mongo_db, get_gridfs, init_gemini
from bson.objectid import ObjectId
import tempfile
import os

chat_agent_bp = Blueprint('chat_agent', __name__)

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

@chat_agent_bp.route('/', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.json or {}
    question = data.get('question', '').strip()
    user_email = data.get('user_email', '')
    file_id = data.get('file_id', '')

    if not question:
        return jsonify({"error": "請輸入問題"}), 400

    model = init_gemini()
    if not model:
        return jsonify({"error": "AI 服務未初始化"}), 500

    context = ""

    # 如果有指定教材，從 MongoDB 取出內容作為 context
    if file_id:
        try:
            db = get_mongo_db()
            material = db.materials.find_one({"_id": file_id})
            if material:
                analysis = material.get('analysis')
                if analysis:
                    # 優先用已分析的結果
                    key_concepts = analysis.get('key_concepts', [])
                    concepts_text = "\n".join([f"- {c['name']}: {c['description']}" for c in key_concepts])
                    context = f"""
教材標題：{analysis.get('title', '')}
學科：{analysis.get('subject', '')}
摘要：{analysis.get('summary', '')}
核心概念：
{concepts_text}
"""
                else:
                    # 從 GridFS 讀原始檔案
                    grid_id = material.get('grid_id')
                    save_filename = material.get('save_filename', 'file.txt')
                    if grid_id:
                        fs = get_gridfs()
                        grid_file = fs.get(ObjectId(grid_id))
                        ext = os.path.splitext(save_filename)[1]
                        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                            tmp.write(grid_file.read())
                            tmp_path = tmp.name
                        context = extract_text_from_file(tmp_path)[:6000]
                        os.unlink(tmp_path)
        except Exception as e:
            print(f"讀取教材失敗: {e}")

    if context:
        prompt = f"""你是一個教育 AI 助理，請根據以下教材內容回答學生的問題。

教材內容：
{context}

學生問題：{question}

請用繁體中文回答，回答要清楚易懂，如果問題與教材無關也可以正常回答。"""
    else:
        prompt = f"""你是一個教育 AI 助理，請用繁體中文回答以下問題：

{question}"""

    try:
        response = model.generate_content(prompt)
        answer = response.text.strip()
        return jsonify({"answer": answer}), 200
    except Exception as e:
        return jsonify({"error": f"AI 回應失敗: {str(e)}"}), 500
