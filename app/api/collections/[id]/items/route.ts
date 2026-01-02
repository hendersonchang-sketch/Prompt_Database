
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add items to collection (Batch Import)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { promptIds } = await req.json(); // Array of prompt IDs

        if (!promptIds || !Array.isArray(promptIds)) {
            return NextResponse.json({ error: "Invalid promptIds" }, { status: 400 });
        }

        // 1. Validate existence of prompts to prevent FK errors
        const existingPrompts = await prisma.promptEntry.findMany({
            where: { id: { in: promptIds } },
            select: { id: true }
        });

        const validIds = existingPrompts.map(p => p.id);
        const ignoredCount = promptIds.length - validIds.length;

        if (validIds.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No valid prompt IDs found",
                added: 0,
                ignored: ignoredCount
            });
        }

        // 2. Connect valid prompts to collection
        const updated = await prisma.collection.update({
            where: { id: params.id },
            data: {
                prompts: {
                    connect: validIds.map((id: string) => ({ id }))
                }
            },
            include: {
                _count: { select: { prompts: true } }
            }
        });

        // 3. Auto-set cover image if empty
        if (!updated.coverImage && validIds.length > 0) {
            const firstPrompt = await prisma.promptEntry.findUnique({
                where: { id: validIds[0] },
                select: { imageUrl: true }
            });

            if (firstPrompt?.imageUrl) {
                await prisma.collection.update({
                    where: { id: params.id },
                    data: { coverImage: firstPrompt.imageUrl }
                });
            }
        }

        return NextResponse.json({
            success: true,
            collection: updated,
            added: validIds.length,
            ignored: ignoredCount,
            totalItems: updated._count?.prompts
        });
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
