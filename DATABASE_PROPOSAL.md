
# 🗄️ 資料庫功能與優化建議 (Database Optimization Proposal)

針對目前的 SQLite 架構與應用成長需求，提出以下 4 點關鍵優化建議：

## 1. 建立「作品集」分類系統 (Collections)
目前所有生成的圖片都堆在同一張表 (`PromptEntry`)，數量變多後難以管理。
*   **建議新增**：`Collection` 資料表
*   **功能**：類似相簿或資料夾，可以將圖片歸類到「人像」、「建築」、「科幻」等不同主題。
*   **實作**：
    ```prisma
    model Collection {
      id        String        @id @default(uuid())
      name      String
      prompts   PromptEntry[] // 一對多關係
    }
    ```

## 2. 強化「人格」關聯 (Persona Linking)
目前的 `AlchemistPersona` 與生成的圖片 (`PromptEntry`) 之間沒有直接關聯。您無法查詢「這位攝影大師人格生成過哪些圖」。
*   **建議優化**：在 `PromptEntry` 新增 `personaId` 外鍵。
*   **效益**：可以反向追蹤，甚至統計哪個人格最受歡迎、效果最好。

## 3. 標籤系統正規化 (Tagging System)
目前的 `tags` 欄位只是一個純文字字串 (String, "girl, cat, blue")。這導致搜尋效能低落，且難以做標籤雲或自動完成。
*   **建議優化**：改為多對多關聯 (`Tags` Table)。
*   **效益**：搜尋速度提升 10 倍以上，且能做「點擊標籤搜尋」。

## 4. 效能索引優化 (Indexing)
隨著圖片數量破千，畫廊加載會變慢。
*   **建議優化**：在常用查詢欄位加上 Index。
    ```prisma
    model PromptEntry {
      // ...
      @@index([isFavorite]) // 加速「我的最愛」過濾
      @@index([createdAt])  // 加速「最新圖片」排序
    }
    ```

---
**推薦執行順序**：
建議優先執行 **[4. 索引優化]** 與 **[2. 人格關聯]**，因為這兩項改動最小但效益最直接。
**[1. 作品集]** 與 **[3. 標籤]** 涉及較大 UI 改動，可列為下一階段目標。
