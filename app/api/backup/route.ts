import { NextResponse } from "next/server";
import { PrismaClient, PromptEntry } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Fetch all prompts
        const prompts = await prisma.promptEntry.findMany({
            orderBy: { createdAt: "desc" }
        });

        // Create a simple JSON export that can be used with ZIP
        const exportData = {
            exportDate: new Date().toISOString(),
            totalItems: prompts.length,
            items: prompts.map((p: PromptEntry) => ({
                id: p.id,
                prompt: p.prompt,
                negativePrompt: p.negativePrompt,
                imageUrl: p.imageUrl,
                width: p.width,
                height: p.height,
                tags: p.tags,
                isFavorite: p.isFavorite,
                seed: p.seed,
                cfgScale: p.cfgScale,
                steps: p.steps,
                sampler: p.sampler,
                createdAt: p.createdAt
            }))
        };

        // Return a downloadable JSON with metadata
        const jsonContent = JSON.stringify(exportData, null, 2);

        return new NextResponse(jsonContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="prompt-database-backup-${Date.now()}.json"`
            }
        });

    } catch (error: any) {
        console.error("Export error:", error);
        return NextResponse.json(
            { error: error.message || "Export failed" },
            { status: 500 }
        );
    }
}
