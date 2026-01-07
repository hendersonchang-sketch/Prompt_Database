/**
 * 為現有人格添加分類標籤
 * 直接操作 SQLite 資料庫，無需 Prisma Migration
 */
import Database from 'better-sqlite3';
import * as path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const db = new Database(dbPath);

// 分類邏輯
function categorizeByName(name: string): string {
    const n = name.toLowerCase();

    if (n.includes('攝影') || n.includes('photographer') || n.includes('portrait') || n.includes('拍照') || n.includes('photo')) {
        return '01_攝影類';
    }
    if (n.includes('logo') || n.includes('vector') || n.includes('盲盒') || n.includes('toy') || n.includes('室內') || n.includes('architect') || n.includes('isometric')) {
        return '02_設計類';
    }
    if (n.includes('anime') || n.includes('動畫') || n.includes('水彩') || n.includes('watercolor') || n.includes('水墨') || n.includes('ink') || n.includes('鉛筆') || n.includes('pencil') || n.includes('漫畫') || n.includes('手繪角色')) {
        return '03_藝術類';
    }
    if (n.includes('brush') || n.includes('筆觸') || n.includes('ribbon') || n.includes('緞帶') || n.includes('城市') || n.includes('flag') || n.includes('hourglass') || n.includes('沙漏') || n.includes('banknote') || n.includes('鈔票') || n.includes('絲') || n.includes('silk') || n.includes('海報')) {
        return '04_海報旅遊類';
    }
    if (n.includes('food') || n.includes('美食') || n.includes('cook') || n.includes('料理') || n.includes('chef') || n.includes('zen') || n.includes('食') || n.includes('懸浮')) {
        return '05_食物類';
    }
    if (n.includes('book') || n.includes('立體書') || n.includes('lego') || n.includes('樂高') || n.includes('terrarium') || n.includes('苔蘚') || n.includes('生態') || n.includes('desk') || n.includes('桌面') || n.includes('畫桌') || n.includes('百科')) {
        return '06_特殊場景類';
    }
    if (n.includes('expression') || n.includes('表情') || n.includes('pose') || n.includes('姿勢') || n.includes('turnaround') || n.includes('三視圖') || n.includes('storyboard') || n.includes('分鏡') || n.includes('九宮格')) {
        return '07_角色參考類';
    }
    if (n.includes('fusion') || n.includes('融合') || n.includes('chaos') || n.includes('混亂') || n.includes('epoch') || n.includes('monument') || n.includes('surreal') || n.includes('超現實') || n.includes('material') || n.includes('材質') || n.includes('dimension') || n.includes('次元') || n.includes('微縮世界') || n.includes('微觀') || n.includes('萬物')) {
        return '08_進階融合類';
    }

    return '其他';
}

try {
    console.log('開始添加 category 欄位...\n');

    // 1. 檢查欄位是否已存在
    const tableInfo = db.prepare("PRAGMA table_info(AlchemistPersona)").all();
    const hasCategory = tableInfo.some((col: any) => col.name === 'category');

    if (!hasCategory) {
        console.log('添加 category 欄位到資料庫...');
        db.prepare('ALTER TABLE AlchemistPersona ADD COLUMN category TEXT DEFAULT "其他"').run();
        console.log('✓ 欄位添加成功\n');
    } else {
        console.log('✓ category 欄位已存在\n');
    }

    // 2. 獲取所有人格
    const personas = db.prepare('SELECT id, name FROM AlchemistPersona').all() as Array<{ id: string, name: string }>;
    console.log(`找到 ${personas.length} 個人格，開始分類...\n`);

    // 3. 更新每個人格的分類
    const updateStmt = db.prepare('UPDATE AlchemistPersona SET category = ? WHERE id = ?');
    const categoryStats: Record<string, number> = {};

    for (const persona of personas) {
        const category = categorizeByName(persona.name);
        updateStmt.run(category, persona.id);
        categoryStats[category] = (categoryStats[category] || 0) + 1;
        console.log(`✓ [${category}] ${persona.name}`);
    }

    // 4. 顯示統計結果
    console.log('\n=== 分類統計 ===');
    Object.entries(categoryStats).sort().forEach(([cat, count]) => {
        console.log(`${cat}: ${count} 個`);
    });

    console.log(`\n✅ 成功為 ${personas.length} 個人格添加分類！`);

} catch (error) {
    console.error('錯誤:', error);
} finally {
    db.close();
}
