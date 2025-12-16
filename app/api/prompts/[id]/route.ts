import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        await prisma.promptEntry.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        const entry = await prisma.promptEntry.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(entry);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
    }
}
