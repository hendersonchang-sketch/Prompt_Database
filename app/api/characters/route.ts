
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const characters = await prisma.character.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(characters);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, basePrompt, seed, avatarUrl } = body;

        if (!name || !basePrompt) {
            return NextResponse.json({ error: 'Name and Base Prompt are required' }, { status: 400 });
        }

        const character = await prisma.character.create({
            data: {
                name,
                description,
                basePrompt,
                seed: seed ? parseInt(seed) : -1,
                avatarUrl
            }
        });

        return NextResponse.json(character);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await prisma.character.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
    }
}
