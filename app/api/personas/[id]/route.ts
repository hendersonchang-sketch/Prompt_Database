
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { id } = params;

        const updated = await prisma.alchemistPersona.update({
            where: { id },
            data: body
        });
        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.alchemistPersona.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
