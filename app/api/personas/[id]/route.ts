
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 自動分類函數（與 route.ts 相同）
function autoCategorizePersona(name: string, systemPrompt?: string): string {
    const text = `${name} ${systemPrompt || ''}`.toLowerCase();

    if (text.includes('攝影') || text.includes('photographer') || text.includes('portrait') || text.includes('拍照') || text.includes('photo')) {
        return '01_攝影類';
    }
    if (text.includes('logo') || text.includes('vector') || text.includes('盲盒') || text.includes('toy') || text.includes('室內') || text.includes('architect') || text.includes('isometric') || text.includes('設計')) {
        return '02_設計類';
    }
    if (text.includes('anime') || text.includes('動畫') || text.includes('水彩') || text.includes('watercolor') || text.includes('水墨') || text.includes('ink') || text.includes('鉛筆') || text.includes('pencil') || text.includes('漫畫')) {
        return '03_藝術類';
    }
    if (text.includes('brush') || text.includes('筆觸') || text.includes('ribbon') || text.includes('緞帶') || text.includes('城市') || text.includes('flag') || text.includes('hourglass') || text.includes('沙漏') || text.includes('banknote') || text.includes('鈔票') || text.includes('絲') || text.includes('silk') || text.includes('海報')) {
        return '04_海報旅遊類';
    }
    if (text.includes('food') || text.includes('美食') || text.includes('cook') || text.includes('料理') || text.includes('chef') || text.includes('zen') || text.includes('食') || text.includes('懸浮')) {
        return '05_食物類';
    }
    if (text.includes('book') || text.includes('立體書') || text.includes('lego') || text.includes('樂高') || text.includes('terrarium') || text.includes('苔蘚') || text.includes('生態') || text.includes('desk') || text.includes('桌面') || text.includes('畫桌') || text.includes('百科')) {
        return '06_特殊場景類';
    }
    if (text.includes('expression') || text.includes('表情') || text.includes('pose') || text.includes('姿勢') || text.includes('turnaround') || text.includes('三視圖') || text.includes('storyboard') || text.includes('分鏡') || text.includes('九宮格')) {
        return '07_角色參考類';
    }
    if (text.includes('fusion') || text.includes('融合') || text.includes('chaos') || text.includes('混亂') || text.includes('epoch') || text.includes('monument') || text.includes('surreal') || text.includes('超現實') || text.includes('material') || text.includes('材質') || text.includes('dimension') || text.includes('次元') || text.includes('微縮世界') || text.includes('微觀') || text.includes('萬物')) {
        return '08_進階融合類';
    }

    return '其他';
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { id } = params;

        // 如果更新了 name 或 systemPrompt，重新判斷分類
        if (body.name || body.systemPrompt) {
            const current = await prisma.alchemistPersona.findUnique({ where: { id } });
            if (current) {
                const newName = body.name || current.name;
                const newSystemPrompt = body.systemPrompt || current.systemPrompt;
                body.category = autoCategorizePersona(newName, newSystemPrompt);
                console.log(`✨ 人格已更新: ${newName} [${body.category}]`);
            }
        }

        const updated = await prisma.alchemistPersona.update({
            where: { id },
            data: body
        });
        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.alchemistPersona.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
