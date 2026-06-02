# Learning Compass Backend

## 🗂️ 專案結構

```
backend/
├── app.py                  # Flask 主程式
├── config.py               # 設定檔
├── accessories.py          # 資料庫初始化、AI 初始化
├── requirements.txt        # 套件清單
├── uploads/                # 上傳教材存放位置（自動建立）
├── outputs/                # 生成的投影片存放位置（自動建立）
└── src/
    ├── __init__.py
    ├── login.py            # 登入/登出 API
    ├── register.py         # 註冊/驗證 API
    ├── material_upload.py  # 教材上傳 API
    ├── main_agent.py       # Main Agent：解析教材、萃取知識點
    ├── quiz_agent.py       # Sub-Agent：自動出題
    ├── summary_agent.py    # Sub-Agent：生成重點筆記
    └── ppt_agent.py        # Sub-Agent：生成投影片
```

## 🚀 API 路由總覽

| 方法 | 路由 | 說明 |
|------|------|------|
| POST | /login/login_user | 登入 |
| POST | /register/register_user | 註冊 |
| GET  | /register/verify/<token> | Email 驗證 |
| POST | /material/upload | 上傳教材 |
| GET  | /material/list | 列出教材 |
| DELETE | /material/delete/<id> | 刪除教材 |
| POST | /agent/analyze/<material_id> | Main Agent 分析教材 |
| GET  | /agent/status/<material_id> | 查詢分析狀態 |
| POST | /quiz/generate/<material_id> | 生成練習題 |
| GET  | /quiz/list/<material_id> | 列出題目 |
| POST | /summary/generate/<material_id> | 生成重點筆記 |
| GET  | /summary/get/<material_id> | 取得筆記 |
| POST | /ppt/generate/<material_id> | 生成投影片 |
| GET  | /ppt/download/<material_id> | 下載投影片 |
| GET  | /api/health | 健康檢查 |

## ⚙️ 環境設定

1. 設定 Gemini API Key（必須）：
```
GEMINI_API_KEY=你的API金鑰
```

2. 確認 MySQL、MongoDB、Redis 已啟動

3. 在 config.py 修改資料庫密碼（預設為 123456）

## 📦 安裝與啟動

```bash
# 安裝套件
pip install -r requirements.txt

# 啟動後端
python app.py
```

## 🔄 使用流程

1. 上傳教材 → POST /material/upload
2. 分析教材 → POST /agent/analyze/<material_id>
3. 生成三種輸出（可同時執行）：
   - 重點筆記 → POST /summary/generate/<material_id>
   - 練習題   → POST /quiz/generate/<material_id>
   - 投影片   → POST /ppt/generate/<material_id>
4. 下載投影片 → GET /ppt/download/<material_id>
