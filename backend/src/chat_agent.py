"""
chat_agent.py

一般對話功能（非教材問答），換成 Claude API。
路由：POST /chat/
"""

from flask import request, jsonify, Blueprint
from accessories import get_mongo_db, get_gridfs
from bson.objectid import ObjectId
import anthropic
import tempfile
import os

chat_agent_bp = Blueprint('chat_agent', __name__)

_claude_client = None

def get_claude_client():
    global _claude_client
    if _claude_client is None:
        _claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _claude_client


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
    file_id  = data.get('file_id', '')

    if not question:
        return jsonify({"error": "請輸入問題"}), 400

    context = ""

    if file_id:
        try:
            db = get_mongo_db()
            material = db.materials.find_one({"_id": file_id})
            if material:
                analysis = material.get('analysis')
                if analysis:
                    key_concepts = analysis.get('key_concepts', [])
                    concepts_text = "\n".join(
                        [f"- {c['name']}: {c['description']}" for c in key_concepts]
                    )
                    context = (
                        f"教材標題：{analysis.get('title', '')}\n"
                        f"學科：{analysis.get('subject', '')}\n"
                        f"摘要：{analysis.get('summary', '')}\n"
                        f"核心概念：\n{concepts_text}"
                    )
                else:
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
        system = "你是 Learning Compass 的教育 AI 助理，請根據提供的教材內容回答學生的問題，用繁體中文作答，回答清楚易懂。"
        user_content = f"教材內容：\n{context}\n\n學生問題：{question}"
    else:
        system = "你是 Learning Compass 的教育 AI 助理，請用繁體中文回答以下問題，回答清楚易懂。"
        user_content = question

    try:
        client = get_claude_client()
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=system,
            messages=[{"role": "user", "content": user_content}]
        )
        answer = response.content[0].text.strip()
        return jsonify({"answer": answer}), 200
    except Exception as e:
        return jsonify({"error": f"AI 回應失敗: {str(e)}"}), 500
