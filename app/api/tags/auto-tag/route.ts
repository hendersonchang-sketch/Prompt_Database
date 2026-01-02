import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { analyzeImage } from "@/services/geminiVisionService";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { promptIds } = await req.json();

        if (!promptIds || !Array.isArray(promptIds)) {
            return NextResponse.json({ error: "Invalid promptIds" }, { status: 400 });
        }

        const results = [];
        let successCount = 0;

        // Helper delay function
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Process sequentially to avoid rate limits (or use limited concurrency)
        for (const id of promptIds) {
            // Add a meaningful delay to strict 10 RPM limit (1 req / 6s)
            if (results.length > 0) await sleep(7000);

            try {
                // Fetch prompt to get image URL
                // @ts-ignore - Prisma type definition not updated due to file lock
                const prompt = await prisma.promptEntry.findUnique({
                    where: { id },
                    select: { id: true, imageUrl: true, tags: true }
                });

                if (!prompt || !prompt.imageUrl) {
                    results.push({ id, success: false, error: "Image not found or no URL" });
                    continue;
                }

                // Call Vision Service
                const analysis = await analyzeImage(prompt.imageUrl);

                if (analysis.success && analysis.tags) {
                    // Merge tags
                    const currentTags = prompt.tags ? prompt.tags.split(',').map((t: string) => t.trim()) : [];
                    const newTags = analysis.tags.filter(t => !currentTags.includes(t));
                    const finalTags = [...currentTags, ...newTags].join(',');

                    // Update PromptEntry
                    // @ts-ignore
                    await prisma.promptEntry.update({
                        where: { id: prompt.id },
                        data: { tags: finalTags }
                    });

                    // Upsert Global Tags (update counts)
                    for (const tagName of newTags) {
                        // @ts-ignore
                        await prisma.tag.upsert({
                            where: { name: tagName },
                            update: {
                                count: { increment: 1 },
                                lastUsed: new Date()
                            },
                            create: {
                                name: tagName,
                                count: 1
                            }
                        });
                    }

                    results.push({ id, success: true, addedTags: newTags });
                    successCount++;
                } else {
                    results.push({ id, success: false, error: analysis.error });
                }

            } catch (innerError: any) {
                console.error(`Error processing prompt ${id}:`, innerError);
                results.push({ id, success: false, error: innerError.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: promptIds.length,
            successCount,
            results
        });

    } catch (error) {
        console.error("Auto-Tag API Error:", error);
        return NextResponse.json({ error: "Batch processing failed" }, { status: 500 });
    }
}
