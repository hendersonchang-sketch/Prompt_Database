# 程式修改日誌 (Changelog)

## 2025-12-17

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
| createdAt | DateTime | 建立時間 |
