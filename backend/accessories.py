from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_redis import FlaskRedis
from flask_login import LoginManager
from pymongo import MongoClient
import gridfs
import os
from datetime import datetime

sqldb = SQLAlchemy()
mail = Mail()
redis_client = FlaskRedis()
login_manager = LoginManager()

_mongo_client = None
_mongo_db = None
_gridfs = None

def init_mongodb():
    global _mongo_client, _mongo_db, _gridfs
    if _mongo_db is not None:
        return _mongo_db, _gridfs
    try:
        _mongo_client = MongoClient('mongodb://localhost:27017/')
        _mongo_db = _mongo_client['LearningCompass']
        _gridfs = gridfs.GridFS(_mongo_db)
        print("✅ MongoDB 初始化成功")
        return _mongo_db, _gridfs
    except Exception as e:
        print(f"❌ MongoDB 初始化失敗: {e}")
        return None, None

def get_mongo_db():
    global _mongo_db
    if _mongo_db is None:
        init_mongodb()
    return _mongo_db

def get_gridfs():
    global _gridfs
    if _gridfs is None:
        init_mongodb()
    return _gridfs
