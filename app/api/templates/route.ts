
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const templates = await prisma.promptTemplate.findMany({
            orderBy: [
                { category: 'asc' },
                { order: 'asc' },
            ],
        });
        return NextResponse.json(templates);
    } catch (error) {
        console.error('Failed to fetch templates:', error);
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}
