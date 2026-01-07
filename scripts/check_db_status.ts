/**
 * 檢查資料庫當前狀態
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log('檢查資料庫狀態...\n');

        // 檢查人格數量
        const personaCount = await prisma.alchemistPersona.count();
        console.log(`人格總數: ${personaCount}`);

        if (personaCount > 0) {
            const personas = await prisma.alchemistPersona.findMany({
                select: { id: true, name: true, category: true }
            });

            console.log('\n現有人格：');
            personas.forEach(p => {
                console.log(`- ${p.name} [${p.category || '無分類'}]`);
            });
        } else {
            console.log('\n⚠️ 資料庫中沒有任何人格資料！');
        }

        // 檢查其他表
        const promptCount = await prisma.promptEntry.count();
        console.log(`\nPrompt Entry 數量: ${promptCount}`);

    } catch (error) {
        console.error('錯誤:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
