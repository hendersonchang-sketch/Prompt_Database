/**
 * 匯出煉金術師人格設定
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exportPersonas() {
    try {
        const personas = await prisma.alchemistPersona.findMany({
            orderBy: { createdAt: 'asc' }
        });

        console.log('=== 煉金術師人格設定匯出 ===\n');
        console.log(`總共找到 ${personas.length} 個人格設定\n`);

        personas.forEach((persona, index) => {
            console.log(`\n--- 人格 ${index + 1} ---`);
            console.log(`ID: ${persona.id}`);
            console.log(`名稱: ${persona.name}`);
            console.log(`描述: ${persona.description || '(無)'}`);
            console.log(`內建: ${persona.builtin ? '是' : '否'}`);
            console.log(`預設: ${persona.isDefault ? '是' : '否'}`);
            console.log(`建立時間: ${persona.createdAt}`);
            console.log(`更新時間: ${persona.updatedAt}`);
            console.log(`\n系統提示詞:\n${persona.systemPrompt}`);
            console.log('\n' + '='.repeat(80));
        });

    } catch (error) {
        console.error('錯誤:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportPersonas();
