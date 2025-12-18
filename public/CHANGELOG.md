# 程式修改日誌 (Changelog)

## 2025-12-17

## 2025-12-18

### 🤡 創意圖片工具全套件（NEW）
- **新增** 「🏷️ 貼圖製造機」 (AI Sticker Maker)
  - 支援文字生成與圖片上傳
  - 整合去背功能 (/api/remove-bg)
  - 產生透明背景向量貼圖
- **新增** 「🤡 梗圖大師」 (AI Meme God)
  - AI 生成空白梗圖模板 (強制留白)
  - 支援 AI 自動發想好笑標題
  - 整合 ImageEditor 進行文字編輯
- **增強** 圖片編輯器 (ImageEditor)
  - **新增** 字型選擇功能 (含思源黑體 Noto Sans TC)
  - **優化** 文字拖曳體驗 (游標提示)
  - **修復** 介面排版與側邊欄捲動問題
- **新增** `app/api/meme-gen/route.ts` - 梗圖與標題生成 API

### 📊 全面性評估功能（NEW）
- **新增** `/api/comprehensive-eval/route.ts` - 多維度圖片評估 API
- **新增** `/api/export-report/route.ts` - Markdown 報告匯出 API
- **新增** 「📊 全面評估」按鈕（圖片詳情頁面）
- **新增** 評估結果彈窗，包含：
  - 📈 五維度雷達評分（構圖、色彩、創意、技術、情感）
  - 🤖 AI 生成檢測（可信度、工具推測）
  - ⚠️ 版權風險評估（風險等級、潛在問題）
  - 🛠️ 優化路線圖（可複製的改進 Prompt）
  - 💰 市場價值評估（授權定價、平台建議）
  - 💬 專家評語（優點、需注意、專業建議）
- **新增** 「📥 匯出報告」功能（支援 **Markdown** 與 **HTML** 雙格式）
- **新增** 「📱 社群媒體模擬器」：即時預覽 IG 貼文效果，含 AI 自動生成文案與 Hashtag。
- **新增** 「🧪 Prompt 實驗室」：積木式 Prompt 編輯器與語句庫管理，支援拖放組合與自定義儲存。
- **新增** 「🧠 語義搜尋」：支援自然語言搜尋 (Phase 3)。
- **新增** 「🕸️ 靈感地圖」：視覺化圖片關聯性知識圖譜 (Phase 4)。



### 🆕 上傳圖片功能
- **新增** `/api/upload-image/route.ts` - 上傳圖片 API
- **新增** 圖庫頁面「📤 上傳圖片」按鈕（支援多選）
- 上傳的圖片自動標籤為「上傳」

### 🔬 深度分析增強
- **新增** API 回傳欄位：`technicalSpecs`（技術規格）、`commercialValue`（商業價值）、`similarTemplates`（推薦模板）
- **新增** 評分進度條（總分 + 4 個子項目）
- **新增** 可摺疊區塊（風格、構圖、技術規格、商業價值、社群文案、標籤、修改建議）
- **新增** 配色盤點擊複製 Hex 色碼
- **新增** 「✅ 加入重要標籤到此圖片」按鈕

### ✏️ 修改建議升級
- **變更** 修改建議改為英文 Prompt（可直接用於圖片生成）
- **變更** 問題描述改為大師級評價標準
- **新增** 「📋 複製 Prompt」按鈕

### 💾 Prompt 儲存功能
- **新增** 深度分析風格區「💾 儲存為此圖的 Prompt（含中文翻譯）」
- **新增** 反推結果面板顯示（原本直接填入表單）
- **新增** 反推結果：「📋 複製」、「📝 填入表單」、「💾 儲存（含中文）」按鈕
- **修復** `/api/translate` 支援雙向翻譯（英→中、中→英）

### 🔄 自動回退機制
- **新增** Gemini Native 失敗時自動回退到 Imagen 4.0

---

## 2025-12-16

### 🎨 引擎選擇器
- **新增** Imagen 4.0 / Gemini Native 切換選項
- **新增** 引擎說明 tooltip

### 📊 模板使用統計
- **新增** 統計按鈕顯示模板使用次數
- **新增** 圖表視覺化

### 🗂️ ZIP 匯出/備份
- **新增** `/api/backup/route.ts` - ZIP 備份 API
- **新增** 一鍵下載所有圖片 + JSON 資料

### 🎭 風格融合對話框
- **新增** 選擇兩種風格生成融合 Prompt

### 👤 角色管理 UI
- **新增** 角色庫管理介面

### 🔧 A/B 比較滑桿修復
- **修復** 滑桿拖動問題

### 📍 懸浮按鈕佈局優化
- **修復** 按鈕重疊問題

---

## 專案結構

```
Prompt_Database/
├── app/
│   ├── api/
│   │   ├── analyze-image/    # 深度分析
│   │   ├── backup/           # ZIP 備份
│   │   ├── describe/         # 反推 Prompt
│   │   ├── enhance/          # Prompt 增強
│   │   ├── prompts/          # CRUD 操作
│   │   ├── embeddings/       # 向量生成 (New)
│   │   ├── inspiration-graph/# 靈感地圖 (New)
│   │   ├── prompt-lab/       # 實驗室 API (New)
│   │   ├── translate/        # 翻譯
│   │   ├── upload-image/     # 上傳圖片
│   │   └── variation/        # 變體生成
│   └── page.tsx              # 主頁
├── components/
│   ├── PromptGallery.tsx     # 圖庫元件
│   └── ABCompare.tsx         # A/B 比較
├── prisma/
│   └── schema.prisma         # 資料庫結構
└── CHANGELOG.md              # 本檔案
```

---

## 資料庫欄位 (PromptEntry)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | String | UUID |
| prompt | String | 英文 Prompt |
| promptZh | String? | 中文翻譯 |
| originalPrompt | String? | 原始輸入 |
| imageUrl | String? | 圖片（Base64 或路徑） |
| tags | String? | 標籤（逗號分隔） |
| isFavorite | Boolean | 收藏狀態 |
| width/height | Int | 尺寸 |
| seed | Int? | 隨機種子 |
| cfgScale | Float? | CFG 強度 |
| steps | Int? | 生成步數 |
| negativePrompt | String? | 負面提示詞 |
| embedding | String? | 向量數據 (JSON) |
| createdAt | DateTime | 建立時間 |
