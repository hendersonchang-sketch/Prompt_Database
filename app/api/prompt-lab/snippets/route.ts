import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const snippets = await prisma.promptSnippet.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Group by category
        const grouped = snippets.reduce((acc: any, snippet: any) => {
            if (!acc[snippet.category]) {
                acc[snippet.category] = [];
            }
            acc[snippet.category].push(snippet);
            return acc;
        }, {});

        return NextResponse.json(grouped);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { category, content, label } = body;

        if (!category || !content || !label) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const snippet = await prisma.promptSnippet.create({
            data: {
                category,
                content,
                label
            }
        });

        return NextResponse.json(snippet);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        await prisma.promptSnippet.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
