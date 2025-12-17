import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
    try {
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        await prisma.promptEntry.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        return NextResponse.json({ success: true, deleted: ids.length });
    } catch (error) {
        console.error('Batch delete error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
