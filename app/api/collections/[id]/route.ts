
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get Collection Details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // @ts-ignore - Prisma type definition not updated due to file lock
        const collection = await prisma.collection.findUnique({
            where: { id: params.id },
            include: {
                prompts: {
                    orderBy: { createdAt: 'desc' },
                    include: { tagsRelation: true }
                }
            }
        });

        if (!collection) {
            return NextResponse.json({ error: "Collection not found" }, { status: 404 });
        }

        return NextResponse.json(collection);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
    }
}

// Update Collection
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { name, description, coverImage } = await req.json();

        // @ts-ignore - Prisma type definition not updated due to file lock
        const updated = await prisma.collection.update({
            where: { id: params.id },
            data: {
                name,
                description,
                coverImage // Optional: update cover manually
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
    }
}

// Delete Collection
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // @ts-ignore - Prisma type definition not updated due to file lock
        await prisma.collection.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
    }
}
