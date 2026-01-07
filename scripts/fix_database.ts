/**
 * 使用原始 SQL 檢查並修復資料庫
 */
import Database from 'better-sqlite3';
import * as path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const db = new Database(dbPath);

try {
    console.log('=== 資料庫狀態檢查 ===\n');

    // 1. 檢查人格數量
    const countResult = db.prepare('SELECT COUNT(*) as count FROM AlchemistPersona').get() as { count: number };
    console.log(`人格總數: ${countResult.count}\n`);

    if (countResult.count === 0) {
        console.log('⚠️ 資料庫中沒有人格資料！');
        process.exit(0);
    }

    // 2. 檢查是否有 category 欄位
    const tableInfo = db.prepare("PRAGMA table_info(AlchemistPersona)").all();
    const hasCategory = tableInfo.some((col: any) => col.name === 'category');

    console.log(`Category 欄位存在: ${hasCategory ? '是' : '否'}\n`);

    if (!hasCategory) {
        console.log('添加 category 欄位...');
        db.prepare('ALTER TABLE AlchemistPersona ADD COLUMN category TEXT DEFAULT "其他"').run();
        console.log('✓ 欄位添加成功\n');
    }

    // 3. 顯示前 10 個人格
    console.log('=== 人格列表（前 10 個）===');
    const personas = db.prepare('SELECT id, name, category FROM AlchemistPersona LIMIT 10').all();
    personas.forEach((p: any, i: number) => {
        console.log(`${i + 1}. ${p.name} [${p.category || '無分類'}]`);
    });

    // 4. 如果沒有分類，執行自動分類
    const uncategorized = db.prepare('SELECT COUNT(*) as count FROM AlchemistPersona WHERE category IS NULL OR category = "其他"').get() as { count: number };

    if (uncategorized.count > 0) {
        console.log(`\n發現 ${uncategorized.count} 個未分類人格，開始自動分類...`);

        // 分類邏輯（簡化版）
        const updates = [
            { category: '01_攝影類', keywords: ['攝影', 'photographer', 'portrait', '拍照', 'photo'] },
            { category: '02_設計類', keywords: ['logo', 'vector', '盲盒', 'toy', '室內', 'architect', 'isometric', '設計'] },
            { category: '03_藝術類', keywords: ['anime', '動畫', '水彩', 'watercolor', '水墨', 'ink', '鉛筆', 'pencil', '漫畫'] },
            { category: '04_海報旅遊類', keywords: ['brush', '筆觸', 'ribbon', '緞帶', '城市', 'flag', 'hourglass', '沙漏', 'banknote', '鈔票', '絲', 'silk', '海報'] },
            { category: '05_食物類', keywords: ['food', '美食', 'cook', '料理', 'chef', 'zen', '食', '懸浮'] },
            { category: '06_特殊場景類', keywords: ['book', '立體書', 'lego', '樂高', 'terrarium', '苔蘚', '生態', 'desk', '桌面', '畫桌', '百科'] },
            { category: '07_角色參考類', keywords: ['expression', '表情', 'pose', '姿勢', 'turnaround', '三視圖', 'storyboard', '分鏡', '九宮格'] },
            { category: '08_進階融合類', keywords: ['fusion', '融合', 'chaos', '混亂', 'epoch', 'monument', 'surreal', '超現實', 'material', '材質', 'dimension', '次元', '微縮世界', '微觀', '萬物'] }
        ];

        let updatedCount = 0;
        for (const { category, keywords } of updates) {
            for (const keyword of keywords) {
                const stmt = db.prepare(`UPDATE AlchemistPersona SET category = ? WHERE (category IS NULL OR category = '其他') AND LOWER(name) LIKE ?`);
                const result = stmt.run(category, `%${keyword.toLowerCase()}%`);
                updatedCount += result.changes;
            }
        }

        console.log(`✓ 已更新 ${updatedCount} 個人格的分類\n`);
    }

    // 5. 顯示分類統計
    console.log('=== 分類統計 ===');
    const stats = db.prepare('SELECT category, COUNT(*) as count FROM AlchemistPersona GROUP BY category ORDER BY category').all();
    stats.forEach((s: any) => {
        console.log(`${s.category || '未分類'}: ${s.count} 個`);
    });

    console.log('\n✅ 資料庫檢查完成！');

} catch (error) {
    console.error('錯誤:', error);
} finally {
    db.close();
}
