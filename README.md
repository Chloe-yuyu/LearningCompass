# 🧭 Learning Compass｜學習羅盤

> 世新大學資管系 115 級畢業專題  
> AI 驅動的智慧學習平台——上傳教材，自動生成摘要、練習題、投影片，並提供 AI 即時問答。

---

## 📁 專案結構

```
LearningCompass/
├── frontend/        # Angular 17+ 前端
├── backend/         # Flask 後端
└── README.md
```

---

## 🔧 環境需求

| 工具 | 建議版本 |
|------|---------|
| Node.js | 18 以上 |
| Python | 3.10 以上 |
| MySQL | 8.0 以上 |
| MongoDB | 6.0 以上 |
| Redis | 7.0 以上 |

---

## 🚀 執行步驟

### 1. 複製專案

```bash
git clone https://github.com/Chloe-yuyu/LearningCompass.git
cd LearningCompass
```

---

### 2. 後端設定（Flask）

#### 2-1. 建立虛擬環境並安裝套件

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### 2-2. 設定環境變數

在 `backend/` 資料夾內建立 `.env` 檔（或直接修改 `config.py`）：

```env
# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你的密碼
MYSQL_DB=learning_compass

# MongoDB
MONGO_URI=mongodb://localhost:27017/learning_compass

# Redis
REDIS_URL=redis://localhost:6379/0

# Flask
SECRET_KEY=你的隨機金鑰
MAIL_USERNAME=你的Gmail帳號
MAIL_PASSWORD=你的Gmail應用程式密碼

# Google Gemini AI
GEMINI_API_KEY=你的Gemini金鑰
```

> ⚠️ `backend/firebase_key.json` 含有 Google Cloud 憑證，**不可上傳 GitHub**，已加入 `.gitignore`。

#### 2-3. 啟動後端伺服器

```bash
# 確認已在 backend/ 目錄且虛擬環境已啟動
python app.py
```

後端預設執行於 **http://localhost:5000**

健康檢查：http://localhost:5000/api/health

---

### 3. 前端設定（Angular）

#### 3-1. 安裝相依套件

```bash
cd frontend
npm install
```

#### 3-2. 啟動開發伺服器

```bash
npx ng serve
```

前端預設執行於 **http://localhost:4200**

---

### 4. 同時啟動前後端（建議）

開啟兩個終端機分別執行：

**終端機 1（後端）**
```bash
cd backend
venv\Scripts\activate    # Windows
python app.py
```

**終端機 2（前端）**
```bash
cd frontend
npx ng serve
```

接著在瀏覽器開啟 **http://localhost:4200**

---

## 📡 後端 API 路由總覽

| 路由前綴 | 功能 |
|---------|------|
| `/login` | 登入 / 登出 |
| `/register` | 註冊新帳號 |
| `/material` | 教材上傳與列表 |
| `/chat` | AI 即時問答 |
| `/summary` | 摘要生成 |
| `/quiz` | 練習題生成 |
| `/ppt` | 投影片大綱生成 |
| `/agent` | 主 AI Agent |
| `/api/health` | 伺服器健康檢查 |

---

## ✨ 主要功能

- **AI 聊天問答**：選擇已上傳的教材，直接向 AI 提問
- **自動摘要**：上傳 PDF / Word / PPT，自動生成重點整理
- **練習題生成**：依教材內容出題，支援選擇題與問答題
- **投影片大綱**：一鍵生成可用於簡報的大綱
- **學習進度追蹤**：記錄每次測驗成績與學習紀錄

---

## 🛠️ 技術棧

| 面向 | 技術 |
|------|------|
| 前端框架 | Angular 17（Standalone Components） |
| UI 設計 | Lingo Design System（Duolingo 風格） |
| 後端框架 | Flask + Flask Blueprints |
| 資料庫 | MySQL + MongoDB |
| 快取 | Redis |
| AI 模型 | Google Gemini API |
| 驗證 | JWT（PyJWT） |

---

## 👩‍💻 開發團隊

世新大學 資訊管理學系 115 級畢業專題小組
