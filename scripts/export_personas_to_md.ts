/**
 * 最終版：手動建立精確的人格ID對應表
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// 使用人格名稱進行精確分類
function categorizeByName(name: string): string {
    const n = name.toLowerCase();

    // 攝影類
    if (n.includes('攝影') || n.includes('photographer') || n.includes('portrait') ||
        n.includes('拍照') || n.includes('photo')) {
        return '01_攝影類';
    }

    // 設計類
    if (n.includes('logo') || n.includes('vector') || n.includes('盲盒') ||
        n.includes('toy') || n.includes('室內') || n.includes('architect') || n.includes('isometric')) {
        return '02_設計類';
    }

    // 藝術類
    if (n.includes('anime') || n.includes('動畫') || n.includes('水彩') || n.includes('watercolor') ||
        n.includes('水墨') || n.includes('ink') || n.includes('鉛筆') || n.includes('pencil')) {
        return '03_藝術類';
    }

    // 海報旅遊類
    if (n.includes('brush') || n.includes('筆觸') || n.includes('ribbon') || n.includes('緞帶') ||
        n.includes('城市') || n.includes('flag') || n.includes('hourglass') || n.includes('沙漏') ||
        n.includes('banknote') || n.includes('鈔票') || n.includes('絲') || n.includes('silk')) {
        return '04_海報旅遊類';
    }

    // 食物類
    if (n.includes('food') || n.includes('美食') || n.includes('cook') || n.includes('料理') ||
        n.includes('chef') || n.includes('zen') || n.includes('食')) {
        return '05_食物類';
    }

    // 特殊場景類
    if (n.includes('book') || n.includes('立體書') || n.includes('lego') || n.includes('樂高') ||
        n.includes('terrarium') || n.includes('苔蘚') || n.includes('生態') || n.includes('desk') ||
        n.includes('桌面') || n.includes('畫桌') || n.includes('百科')) {
        return '06_特殊場景類';
    }

    // 角色參考類
    if (n.includes('expression') || n.includes('表情') || n.includes('pose') || n.includes('姿勢') ||
        n.includes('turnaround') || n.includes('三視圖') || n.includes('storyboard') || n.includes('分鏡') ||
        n.includes('sketch') || n.includes('手繪角色') || n.includes('九宮格')) {
        return '07_角色參考類';
    }

    // 進階融合類
    if (n.includes('fusion') || n.includes('融合') || n.includes('chaos') || n.includes('混亂') ||
        n.includes('epoch') || n.includes('monument') || n.includes('surreal') || n.includes('超現實') ||
        n.includes('material') || n.includes('材質') || n.includes('dimension') || n.includes('次元') ||
        n.includes('微縮世界') || n.includes('微觀')) {
        return '08_進階融合類';
    }

    return '其他';
}

async function reorganizePersonas() {
    try {
        const personas = await prisma.alchemistPersona.findMany({
            orderBy: { createdAt: 'asc' }
        });

        const baseDir = path.join(process.cwd(), 'personas');

        // 先清空所有分類資料夾
        const categories = ['01_攝影類', '02_設計類', '03_藝術類', '04_海報旅遊類',
            '05_食物類', '06_特殊場景類', '07_角色參考類', '08_進階融合類', '其他'];

        for (const cat of categories) {
            const catDir = path.join(baseDir, cat);
            if (fs.existsSync(catDir)) {
                fs.rmSync(catDir, { recursive: true, force: true });
            }
            fs.mkdirSync(catDir, { recursive: true });
        }

        const categoryStats: Record<string, number> = {};

        console.log(`\n開始重新分類 ${personas.length} 個人格設定...\n`);

        for (const persona of personas) {
            const category = categorizeByName(persona.name);
            const categoryDir = path.join(baseDir, category);

            categoryStats[category] = (categoryStats[category] || 0) + 1;

            const fileName = `${persona.name.replace(/[\/\\:*?"<>|]/g, '_')}.md`;
            const filePath = path.join(categoryDir, fileName);

            const content = generateMarkdownContent(persona, category);

            fs.writeFileSync(filePath, content, 'utf-8');
            console.log(`✓ [${category}] ${fileName}`);
        }

        console.log('\n=== 分類統計 ===');
        Object.entries(categoryStats).sort().forEach(([cat, count]) => {
            console.log(`${cat}: ${count} 個`);
        });
        console.log(`\n總計: ${personas.length} 個`);

    } catch (error) {
        console.error('錯誤:', error);
    } finally {
        await prisma.$disconnect();
    }
}

function generateMarkdownContent(persona: any, category: string): string {
    return `# ${persona.name}

> **分類**: ${category}  
> **建立時間**: ${persona.createdAt.toLocaleDateString('zh-TW')}  
> **更新時間**: ${persona.updatedAt.toLocaleDateString('zh-TW')}

## 📋 描述

${persona.description || '(無描述)'}

## 🎭 系統提示詞

\`\`\`plaintext
${persona.systemPrompt}
\`\`\`

## 🏷️ 屬性

- **內建人格**: ${persona.builtin ? '✅ 是' : '❌ 否'}
- **預設人格**: ${persona.isDefault ? '✅ 是' : '❌ 否'}

---

*人格 ID: \`${persona.id}\`*
`;
}

reorganizePersonas();
