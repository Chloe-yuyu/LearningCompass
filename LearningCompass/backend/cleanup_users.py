from app import app
from firebase_config import get_db
from werkzeug.security import generate_password_hash
import uuid

with app.app_context():
    db = get_db()
    
    # 取得所有 users
    docs = list(db.collection('users').stream())
    print(f"目前共有 {len(docs)} 筆會員資料")
    
    for doc in docs:
        data = doc.to_dict()
        email = data.get('email', '')
        
        # 保留 test@test.com，刪除其他
        if email == 'test@test.com':
            print(f"✅ 保留：{email}")
        else:
            db.collection('users').document(doc.id).delete()
            print(f"🗑️ 刪除：{email}")
    
    print("完成！")
