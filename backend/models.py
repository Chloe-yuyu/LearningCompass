from accessories import sqldb
from datetime import datetime

class OutputFile(sqldb.Model):
    """所有 AI 生成的輸出檔案紀錄"""
    __tablename__ = 'output_files'

    id = sqldb.Column(sqldb.Integer, primary_key=True, autoincrement=True)
    material_id = sqldb.Column(sqldb.String(100), nullable=False, index=True)
    user_email = sqldb.Column(sqldb.String(200), nullable=False, index=True)
    output_type = sqldb.Column(sqldb.String(50), nullable=False)  # summary / quiz / ppt
    mongo_id = sqldb.Column(sqldb.String(100))  # MongoDB collection 的 document id
    grid_id = sqldb.Column(sqldb.String(100))   # GridFS 的 file id（ppt 才有）
    filename = sqldb.Column(sqldb.String(200))  # 檔案名稱（ppt 才有）
    status = sqldb.Column(sqldb.String(50), default='done')
    created_at = sqldb.Column(sqldb.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'material_id': self.material_id,
            'user_email': self.user_email,
            'output_type': self.output_type,
            'mongo_id': self.mongo_id,
            'grid_id': self.grid_id,
            'filename': self.filename,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }

class QuizResult(sqldb.Model):
    """使用者答題紀錄"""
    __tablename__ = 'quiz_result'

    id = sqldb.Column(sqldb.Integer, primary_key=True, autoincrement=True)
    user_email = sqldb.Column(sqldb.String(200), nullable=False, index=True)
    material_id = sqldb.Column(sqldb.String(100), nullable=False)
    quiz_id = sqldb.Column(sqldb.String(100), nullable=False)
    score = sqldb.Column(sqldb.Float, default=0)
    total_questions = sqldb.Column(sqldb.Integer, default=0)
    correct_answers = sqldb.Column(sqldb.Integer, default=0)
    created_at = sqldb.Column(sqldb.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'material_id': self.material_id,
            'quiz_id': self.quiz_id,
            'score': self.score,
            'total_questions': self.total_questions,
            'correct_answers': self.correct_answers,
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }

class LearningProgress(sqldb.Model):
    """學習進度追蹤"""
    __tablename__ = 'learning_progress'

    id = sqldb.Column(sqldb.Integer, primary_key=True, autoincrement=True)
    user_email = sqldb.Column(sqldb.String(200), nullable=False, index=True)
    material_id = sqldb.Column(sqldb.String(100), nullable=False)
    has_analyzed = sqldb.Column(sqldb.Boolean, default=False)
    has_summary = sqldb.Column(sqldb.Boolean, default=False)
    has_quiz = sqldb.Column(sqldb.Boolean, default=False)
    has_ppt = sqldb.Column(sqldb.Boolean, default=False)
    last_accessed = sqldb.Column(sqldb.DateTime, default=datetime.now)
    updated_at = sqldb.Column(sqldb.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'material_id': self.material_id,
            'has_analyzed': self.has_analyzed,
            'has_summary': self.has_summary,
            'has_quiz': self.has_quiz,
            'has_ppt': self.has_ppt,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else '',
            'updated_at': self.updated_at.isoformat() if self.updated_at else ''
        }
