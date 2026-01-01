
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add items to collection
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { promptIds } = await req.json(); // Array of prompt IDs

        if (!promptIds || !Array.isArray(promptIds)) {
            return NextResponse.json({ error: "Invalid promptIds" }, { status: 400 });
        }

        // Connect prompts to collection
        const updated = await prisma.collection.update({
            where: { id: params.id },
            data: {
                prompts: {
                    connect: promptIds.map((id: string) => ({ id }))
                }
            },
            include: {
                _count: { select: { prompts: true } }
            }
        });

        // Auto-set cover image if empty
        if (!updated.coverImage && promptIds.length > 0) {
            const firstPrompt = await prisma.promptEntry.findUnique({
                where: { id: promptIds[0] },
                select: { imageUrl: true }
            });

            if (firstPrompt?.imageUrl) {
                await prisma.collection.update({
                    where: { id: params.id },
                    data: { coverImage: firstPrompt.imageUrl }
                });
            }
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to add items" }, { status: 500 });
    }
}

// Remove items from collection
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { promptIds } = await req.json();

        if (!promptIds || !Array.isArray(promptIds)) {
            return NextResponse.json({ error: "Invalid promptIds" }, { status: 400 });
        }

        await prisma.collection.update({
            where: { id: params.id },
            data: {
                prompts: {
                    disconnect: promptIds.map((id: string) => ({ id }))
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to remove items" }, { status: 500 });
    }
}
