import firebase_admin
from firebase_admin import credentials, firestore
from pymongo import MongoClient
import gridfs
import os

_firebase_initialized = False
_db = None
_mongo_client = None
_gridfs = None

def init_firebase():
    global _firebase_initialized, _db

    if _firebase_initialized:
        return _db

    try:
        key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'firebase_key.json')
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        _db = firestore.client()
        _firebase_initialized = True
        print("✅ Firebase 初始化成功")
        return _db
    except Exception as e:
        print(f"❌ Firebase 初始化失敗: {e}")
        return None

def init_mongodb():
    global _mongo_client, _gridfs

    if _gridfs is not None:
        return _mongo_client, _gridfs

    try:
        _mongo_client = MongoClient('mongodb://localhost:27017/')
        db = _mongo_client['LearningCompass']
        _gridfs = gridfs.GridFS(db)
        print("✅ MongoDB GridFS 初始化成功")
        return _mongo_client, _gridfs
    except Exception as e:
        print(f"❌ MongoDB 初始化失敗: {e}")
        return None, None

def get_db():
    global _db
    if _db is None:
        init_firebase()
    return _db

def get_gridfs():
    global _gridfs
    if _gridfs is None:
        init_mongodb()
    return _gridfs

def get_mongo_db():
    global _mongo_client
    if _mongo_client is None:
        init_mongodb()
    return _mongo_client['LearningCompass'] if _mongo_client else None
