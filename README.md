# Learning Compass 🧭

AI 驅動的智慧學習平台，以 Claude Agent SDK 為核心，支援跨教材語意搜尋與多種學習任務。

---

## 專案架構

```
LearningCompass/
├── backend/          # Flask 後端
│   ├── agents/       # Claude Agent SDK 核心
│   ├── skills/       # 各 Skill Tool 定義
│   └── src/          # 登入、註冊、上傳、聊天
└── frontend/         # Angular 前端
```

---

## Agent 架構

```
User（自由文字輸入）
        ↓
Claude Main Agent（總控制代理人）
        ↓
┌───────────────────────────────────────┐
│           RAG Agent（跨教材檢索）      │
│  Step 1: search_current_material()    │  → 搜尋選取的教材
│  Step 2: search_related_materials()   │  → 自動擴展其他相關教材
└───────────────────────────────────────┘
        ↓
根據 function 分派：
  chat    → 直接問答
  summary → 生成筆記摘要
  quiz    → 生成練習題
  ppt     → 生成投影片大綱
```

---

## 環境需求

| 工具 | 建議版本 |
|------|---------|
| Python | 3.10 以上 |
| Node.js | 18 以上 |
| npm | 9 以上 |
| Angular CLI | 17 以上 |

---

## 執行步驟

### 1. 取得專案

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

在 `backend/` 目錄下建立 `.env` 檔案：

```
ANTHROPIC_API_KEY=你的_Anthropic_API_Key
MONGODB_URI=你的_MongoDB_連線字串
JWT_SECRET=自訂的_JWT_金鑰
```

> **注意：** `backend/firebase_key.json`（若有）絕對不可上傳至 Git。  
> 請確認 `.gitignore` 已包含此檔案。

#### 2-3. 啟動後端伺服器

```bash
# 確認在 backend/ 目錄下且虛擬環境已啟動
python app.py
```

後端預設運行於 **http://localhost:5000**

---

### 3. 前端設定（Angular）

#### 3-1. 安裝套件

```bash
cd frontend
npm install
```

#### 3-2. 啟動開發伺服器

```bash
npx ng serve
```

前端預設運行於 **http://localhost:4200**

---

### 4. 開啟瀏覽器

前後端都啟動後，開啟瀏覽器前往：

```
http://localhost:4200
```

---

## 常見問題

### Q：前端畫面沒有更新？
執行 `npx ng serve` 後，在瀏覽器按 **Ctrl + Shift + R**（強制重整清除快取）。

### Q：登入後跳回登入頁？
表示 JWT token 過期或格式錯誤。  
請開啟瀏覽器 DevTools → Application → Local Storage，清除所有 `user_email`、`token`、`user_name` 後重新登入。

### Q：上傳教材後看不到？
確認後端 `.env` 的 `MONGODB_URI` 正確，且 MongoDB 服務正在運行。

### Q：AI 無法回應？
確認 `ANTHROPIC_API_KEY` 已正確設定，且 API 額度充足。

---

## 主要功能

| 功能 | 說明 |
|------|------|
| 📤 上傳教材 | 支援 PDF、Word、PowerPoint |
| 💬 AI 問答 | 針對教材內容即時提問 |
| 📝 筆記摘要 | 自動生成教材重點 |
| ✏️ 練習題 | 依教材內容出題 |
| 📊 投影片大綱 | 生成簡報架構 |
| 👤 個人資料 | 姓名、學校、科系編輯 |

---

## 開發團隊

世新大學資訊管理學系 115 屆畢業專題
