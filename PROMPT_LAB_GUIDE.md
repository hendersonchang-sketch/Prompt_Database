# 🧪 Prompt 實驗室使用指南

**Prompt 實驗室** 是一個專為 Stable Diffusion / Midjourney 用戶設計的提示詞構建工具，採用「積木式」的設計理念，幫助您快速組合出高品質的 Prompt。

## 🚀 快速開始

1.  **開啟實驗室**：點擊首頁頂部的 `🧪 實驗室` 按鈕。
2.  **選擇分類**：在左側面板選擇需要的類別（如 `Style`, `Quality`）。
3.  **組合積木**：點擊標籤將其加入右側組合區。
4.  **補充描述**：在右下角輸入框填寫具體的主題描述。
5.  **生成**：點擊 `✨ 使用此 Prompt`。

---

## 🧩 功能詳解

### 1. 語句庫 (Snippets Library) - 左側面板
語句庫包含五大類別，協助您結構化地思考 Prompt：
*   **Subject (主體)**：描述畫面主角的特徵。
*   **Style (風格)**：如 Cyberpunk, Watercolor, Photorealistic。
*   **Lighting (光影)**：如 Cinematic Lighting, Volumetric Lighting。
*   **Camera (相機)**：如 8k, Ultra-detailed, Macro shot。
*   **Quality (品質)**：如 Masterpiece, Best Quality。

> **💡 小技巧**：您可以點擊左上角的 `+ 新增片段`，將常用的詞彙（例如特定的 LoRA 觸發詞）永久存入資料庫。

### 2. 工作區 (Workbench) - 右側面板
*   **積木區**：已選擇的片段會顯示為彩色標籤。
    *   點擊 `×` 可以移除單個片段。
    *   積木的順序目前是依加入順序排列。
*   **自定義輸入 (Custom Input)**：
    *   這裡適合輸入無法被標準化的內容，例如具體的動作、場景描述。
    *   例："a girl sitting on a bench, raining, holding an umbrella"

### 3. 輸出與應用
*   **預覽**：系統會自動用逗號連接所有片段與自定義輸入。
*   **複製**：點擊預覽框右上角的 `📋` 圖示可單獨複製文字。
*   **使用此 Prompt**：點擊後會自動關閉視窗，並將內容填入首頁的 `Prompt` 輸入框，準備生成。

---

## ⚠️ 常見問題

**Q: 為什麼新增片段後沒有出現？**
A: 新增功能依賴後端資料庫。如果您剛更新過程式碼（例如 Phase 3/4 更新），請務必**重啟伺服器** (`npm run dev`) 以確保資料庫 schema 正確載入。

**Q: 實驗室的內容會覆蓋我原本輸入的 Prompt 嗎？**
A: 是的，點擊「使用此 Prompt」會覆蓋主頁面輸入框目前的內容。建議先在實驗室組合好再送出。
