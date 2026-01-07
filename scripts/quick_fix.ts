/**
 * 簡化版資料庫修復 - 只添加欄位和分類
 */
import Database from 'better-sqlite3';
import * as path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

try {
    const db = new Database(dbPath);

    console.log('檢查資料庫...');

    // 檢查人格數量
    const count = db.prepare('SELECT COUNT(*) as c FROM AlchemistPersona').get() as any;
    console.log(`人格總數: ${count.c}`);

    // 檢查是否有 category 欄位
    const cols = db.prepare("PRAGMA table_info(AlchemistPersona)").all();
    const hasCategory = cols.some((c: any) => c.name === 'category');

    if (!hasCategory) {
        console.log('添加 category 欄位...');
        db.prepare('ALTER TABLE AlchemistPersona ADD COLUMN category TEXT DEFAULT "其他"').run();
        console.log('✓ 完成');
    } else {
        console.log('category 欄位已存在');
    }

    // 自動分類
    const updates = [
        ['01_攝影類', '%攝影%'],
        ['01_攝影類', '%photo%'],
        ['02_設計類', '%設計%'],
        ['02_設計類', '%logo%'],
        ['03_藝術類', '%動畫%'],
        ['03_藝術類', '%水墨%'],
        ['04_海報旅遊類', '%海報%'],
        ['04_海報旅遊類', '%城市%'],
        ['05_食物類', '%食%'],
        ['05_食物類', '%料理%'],
        ['06_特殊場景類', '%樂高%'],
        ['06_特殊場景類', '%立體書%'],
        ['07_角色參考類', '%表情%'],
        ['07_角色參考類', '%分鏡%'],
        ['08_進階融合類', '%融合%'],
        ['08_進階融合類', '%次元%']
    ];

    console.log('\n開始分類...');
    for (const [cat, pattern] of updates) {
        const result = db.prepare(`UPDATE AlchemistPersona SET category = ? WHERE (category IS NULL OR category = '其他') AND name LIKE ?`).run(cat, pattern);
        if (result.changes > 0) {
            console.log(`${cat}: +${result.changes}`);
        }
    }

    // 顯示統計
    console.log('\n=== 分類統計 ===');
    const stats = db.prepare('SELECT category, COUNT(*) as count FROM AlchemistPersona GROUP BY category').all();
    stats.forEach((s: any) => {
        console.log(`${s.category}: ${s.count} 個`);
    });

    db.close();
    console.log('\n✅ 完成！');

} catch (e: any) {
    console.error('錯誤:', e.message);
    process.exit(1);
}
