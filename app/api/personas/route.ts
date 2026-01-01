
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const personas = await prisma.alchemistPersona.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(personas);
    } catch (e) {
        console.error("GET Personas Error", e);
        return NextResponse.json({ error: "Failed to fetch personas" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description, systemPrompt } = body;

        const newPersona = await prisma.alchemistPersona.create({
            data: {
                name,
                description,
                systemPrompt
            }
        });
        return NextResponse.json(newPersona);
    } catch (e) {
        console.error("CREATE Persona Error", e);
        return NextResponse.json({ error: "Failed to create persona" }, { status: 500 });
    }
}
