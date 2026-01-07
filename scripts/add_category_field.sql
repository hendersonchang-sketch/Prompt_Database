-- 手動添加 category 欄位到 AlchemistPersona 表
-- 此腳本可直接在 SQLite 上執行

-- 1. 添加 category 欄位
ALTER TABLE AlchemistPersona ADD COLUMN category TEXT DEFAULT '其他';

-- 2. 為現有人格設定添加分類（基於名稱關鍵字）
UPDATE AlchemistPersona SET category = '01_攝影類'
WHERE name LIKE '%攝影%' OR name LIKE '%photographer%' OR name LIKE '%portrait%' OR name LIKE '%拍照%' OR name LIKE '%photo%';

UPDATE AlchemistPersona SET category = '02_設計類'
WHERE name LIKE '%LOGO%' OR name LIKE '%vector%' OR name LIKE '%盲盒%' OR name LIKE '%toy%' OR name LIKE '%室內%' OR name LIKE '%architect%' OR name LIKE '%isometric%';

UPDATE AlchemistPersona SET category = '03_藝術類'
WHERE name LIKE '%anime%' OR name LIKE '%動畫%' OR name LIKE '%水彩%' OR name LIKE '%watercolor%' OR name LIKE '%水墨%' OR name LIKE '%ink%' OR name LIKE '%鉛筆%' OR name LIKE '%pencil%' OR name LIKE '%漫畫%' OR name LIKE '%手繪%';

UPDATE AlchemistPersona SET category = '04_海報旅遊類'
WHERE name LIKE '%brush%' OR name LIKE '%筆觸%' OR name LIKE '%ribbon%' OR name LIKE '%緞帶%' OR name LIKE '%城市%' OR name LIKE '%flag%' OR name LIKE '%hourglass%' OR name LIKE '%沙漏%' OR name LIKE '%banknote%' OR name LIKE '%鈔票%' OR name LIKE '%絲%' OR name LIKE '%silk%' OR name LIKE '%海報%';

UPDATE AlchemistPersona SET category = '05_食物類'
WHERE name LIKE '%food%' OR name LIKE '%美食%' OR name LIKE '%cook%' OR name LIKE '%料理%' OR name LIKE '%chef%' OR name LIKE '%zen%' OR name LIKE '%食%' OR name LIKE '%懸浮%';

UPDATE AlchemistPersona SET category = '06_特殊場景類'
WHERE name LIKE '%book%' OR name LIKE '%立體書%' OR name LIKE '%lego%' OR name LIKE '%樂高%' OR name LIKE '%terrarium%' OR name LIKE '%苔蘚%' OR name LIKE '%生態%' OR name LIKE '%desk%' OR name LIKE '%桌面%' OR name LIKE '%畫桌%' OR name LIKE '%百科%';

UPDATE AlchemistPersona SET category = '07_角色參考類'
WHERE name LIKE '%expression%' OR name LIKE '%表情%' OR name LIKE '%pose%' OR name LIKE '%姿勢%' OR name LIKE '%turnaround%' OR name LIKE '%三視圖%' OR name LIKE '%storyboard%' OR name LIKE '%分鏡%' OR name LIKE '%九宮格%';

UPDATE AlchemistPersona SET category = '08_進階融合類'
WHERE name LIKE '%fusion%' OR name LIKE '%融合%' OR name LIKE '%chaos%' OR name LIKE '%混亂%' OR name LIKE '%epoch%' OR name LIKE '%monument%' OR name LIKE '%surreal%' OR name LIKE '%超現實%' OR name LIKE '%material%' OR name LIKE '%材質%' OR name LIKE '%dimension%' OR name LIKE '%次元%' OR name LIKE '%微縮世界%' OR name LIKE '%微觀%' OR name LIKE '%萬物%';

-- 3. 驗證分類結果
SELECT category, COUNT(*) as count FROM AlchemistPersona GROUP BY category ORDER BY category;
