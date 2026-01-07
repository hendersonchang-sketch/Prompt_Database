
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 自動分類函數
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

export async function GET() {
    try {
        const personas = await prisma.alchemistPersona.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(personas);
    } catch (e) {
        console.error("GET Personas Error", e);
        return NextResponse.json({ error: "Failed to fetch personas" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description, systemPrompt } = body;

        // 自動判斷分類
        const category = autoCategorizePersona(name, systemPrompt);

        const newPersona = await prisma.alchemistPersona.create({
            data: {
                name,
                description,
                systemPrompt,
                category
            }
        });

        console.log(`✨ 新人格已建立: ${name} [${category}]`);
        return NextResponse.json(newPersona);
    } catch (e) {
        console.error("CREATE Persona Error", e);
        return NextResponse.json({ error: "Failed to create persona" }, { status: 500 });
    }
}
