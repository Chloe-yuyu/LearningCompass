import os

class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 3600,
        'pool_size': 5,
        'max_overflow': 10
    }

    SECRET_KEY = os.getenv('SECRET_KEY', 'learning-compass-secret-key-2025')
    SECURITY_PASSWORD_SALT = os.getenv('SECURITY_PASSWORD_SALT', 'learning-compass-salt')

    # 郵件配置
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME', '')

    # MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/LearningCompass')
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'LearningCompass')

    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Gemini API Key
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyAqih7634FR4qTiOScnNbXfweAqEPYaIIE')

class DevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:123456@localhost:3306/learning_compass'
    API_BASE_URL = 'http://localhost:5000'
    DOMAIN_NAME = 'http://localhost:4200'
    DEBUG = True

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:123456@localhost:3306/learning_compass'
    API_BASE_URL = 'http://localhost:5000'
    DOMAIN_NAME = 'http://localhost:4200'
    DEBUG = False
