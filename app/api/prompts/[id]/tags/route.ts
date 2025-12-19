import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const { tags } = await request.json();

        if (typeof tags !== 'string') {
            return NextResponse.json({ error: 'Invalid tags format' }, { status: 400 });
        }

        const updatedPrompt = await prisma.promptEntry.update({
            where: { id },
            data: { tags },
        });

        return NextResponse.json(updatedPrompt);
    } catch (error: any) {
        console.error('Failed to update tags:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
