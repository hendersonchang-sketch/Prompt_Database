# 程式修改日誌 (Changelog)

## 2025-12-17

## 2026-01-02 (v1.2 Release)

### 📚 魔導書系統 (Collections) (Phase 2-4)
- **新增** 個人化收藏集系統 (`Collection` Model)
- **新增** `/api/collections` 系列 API (CRUD, Batch Import/Delete)
- **新增** `CollectionSidebar` 側邊欄：支援拖曳加入、建立新收藏
- **新增** 自動封面管理 (Cover Image Auto-Selection)

### 🪄 AI 自動標籤 (Auto-Tagging) (Phase 10)
- **新增** `/api/tags/auto-tag` API
- **整合** Gemini 1.5 Flash Vision 模型 (因 Rate Limit 回退至 gemini-2.0-flash-exp 並限流 7s/圖)
- **新增** 畫廊批次操作：「🪄 AI Tag」按鈕
- **新增** 自動節流保護機制 (Rate Limiting Protection)

### 🎬 分鏡導演模式 (Storyboard Mode) (Phase 6)
- **新增** "Storyboard Director" Persona
- **新增** 連續生成邏輯：單一 Prompt 自動拆解為 4 張連貫分鏡 (建立/行動/情感/結局)
- **優化** 嚴格 JSON 修復機制，防止 AI 格式錯誤

### ⚡ 效能與 UX 優化 (Phase 6 & 8)
- **新增** `Masonic` 瀑布流佈局：解決大量圖片下的渲染效能問題
- **新增** Smart Placeholders：基於 ID 的確定性漸層佔位符，提升視覺體驗
- **新增** 圖片拖曳功能 (Native Drag & Drop)：直觀整理圖片至收藏集
- **優化** 圖片儲存機制：Base64 轉為本地檔案系統 (`/public/uploads`)，大幅減少 DB 負擔

---

## 2025-12-18

### ⚡ Gemini 3 Flash 高級功能（NEW）
- **新增** 「🔍 偵探模式」(Regional Tagging)
  - 點擊按鈕啟用圖片物件偵測
  - 圖片上顯示可互動的標籤框
  - 滑鼠懸停顯示繁體中文物件名稱
- **新增** 「📐 構圖指導」(AI Art Director)
  - 空間推理與構圖分析
  - 圖片上顯示視覺焦點標記
  - 提供平衡評價與優化 Prompt 建議
- **新增** 「✂️ 智能裁切」(Smart Crop)
  - AI 分析圖片主體與構圖
  - 5 種社群平台裁切建議（IG 貼文、Story、YouTube 縮圖、大頭貼、Banner）
  - 圖片上即時預覽裁切區域 + 三分法網格
  - 繁體中文裁切理由說明
- **強化** 「🎭 角色提取」(Character DNA Extraction)
  - 結構化 JSON 輸出（Gemini 3 Flash 專屬）
  - 多維度分析：外觀、服裝、藝術風格
  - 一致性標籤 (Consistency Tags)：確保角色在不同場景保持一致
  - 同時輸出英文 + 繁體中文角色描述
- **修復** `/api/detect-objects` 與 `/api/analyze-composition` 前後端參數一致性


### 🔧 API 全面優化（Gemini 3 Flash JSON 模式）
- **優化** `/api/suggest` - 情境感知 + 3 個建議選項
- **優化** `/api/translate` - 70+ 專業術語保留 + 增強翻譯
- **優化** `/api/variation` - 結構化輸出 + 變更追蹤
- **優化** `/api/enhance` - 分數對比 + 新增元素記錄
- **優化** `/api/refine-prompt` - 詳細變更日誌 + 預估新分數
- **優化** `/api/batch-variation` - JSON 陣列 + 每項變更清單
- **優化** `/api/batch-import` - 豐富元數據 + 匯入統計

### 🎨 Prompt 創意工具（NEW）
- **新增** 「🎨 情緒滑桿」(Mood Slider)
  - 5 維度情緒控制：快樂、能量、色溫、神秘、戲劇
  - 強度百分比調整
  - 即時生成情緒版本 Prompt
  - 顯示新增的情緒關鍵詞
- **新增** 「🧬 DNA 比較」(Prompt DNA Compare)
  - 分析兩個 Prompt 的 8 個核心元素
  - 計算整體相似度分數
  - 列出主要差異與影響
  - 提供學習要點與結合建議
  - 自動生成融合 Prompt
- **新增** 「📦 零件拆解」(Exploded View Generator)
  - AI 識別產品所有零件與材質
  - 圖片上顯示零件邊界框標記
  - 估算組裝層級與順序
  - 3 種爆炸視圖風格選擇（技術藍圖、3D 等距、產品攝影）
  - 自動生成專業爆炸視圖 Prompt
- **新增** 「🖼️ 圖生圖」(Image-to-Image)
  - 以圖片為基礎生成新圖
  - 強度滑桿控制（10%-90%）
  - 3 種轉換模式：保留風格、增強品質、風格轉換
  - 8 個快速 Prompt 按鈕（夜晚、雪景、動漫、水彩...）
  - 並排預覽原圖與結果
- **新增** 「🏷️ 智能標籤」(Smart Tag System)
  - AI 自動分析圖片內容
  - 7 層級標籤分類：風格/主體/氛圍/色彩/技術/品質/主題
  - 自動識別主類別（人像/風景/角色/物件...）
  - 標籤選擇與一鍵複製
  - 建議收藏集分類


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
