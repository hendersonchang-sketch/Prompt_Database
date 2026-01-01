
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const collections = await prisma.collection.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { prompts: true }
                }
            }
        });
        return NextResponse.json(collections);
    } catch (error) {
        console.error("Failed to fetch collections:", error);
        return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const collection = await prisma.collection.create({
            data: {
                name,
                description,
            }
        });

        return NextResponse.json(collection);
    } catch (error) {
        console.error("Failed to create collection:", error);
        return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
    }
}
