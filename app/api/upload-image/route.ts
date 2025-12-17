import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { imageBase64, filename, tags } = await request.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
        }

        // Create a new entry with the uploaded image
        const newEntry = await prisma.promptEntry.create({
            data: {
                prompt: `[已上傳圖片] ${filename || 'Untitled'}`,
                imageUrl: imageBase64,
                tags: tags || '上傳',
                isFavorite: false,
            }
        });

        return NextResponse.json({
            success: true,
            id: newEntry.id,
            message: '圖片上傳成功'
        });

    } catch (error: any) {
        console.error('Upload Image Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
