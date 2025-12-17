import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const data = await request.json();

        if (!data.items || !Array.isArray(data.items)) {
            return NextResponse.json({ error: 'Invalid import format. Expected { items: [...] }' }, { status: 400 });
        }

        const publicDir = path.join(process.cwd(), "public", "generated");
        await fs.mkdir(publicDir, { recursive: true });

        let imported = 0;
        let skipped = 0;

        for (const item of data.items) {
            try {
                // Check if we have the required fields
                if (!item.prompt) {
                    skipped++;
                    continue;
                }

                // Handle image - either from URL or base64
                let imagePath = null;

                if (item.imageUrl) {
                    // If it's a base64 data URL
                    if (item.imageUrl.startsWith('data:')) {
                        const matches = item.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
                        if (matches) {
                            const mimeType = matches[1];
                            const base64Data = matches[2];
                            const ext = mimeType.split('/')[1] || 'png';
                            const filename = `imported-${Date.now()}-${imported}.${ext}`;
                            const filePath = path.join(publicDir, filename);
                            await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
                            imagePath = `/generated/${filename}`;
                        }
                    }
                    // If it's a relative path (from previous export)
                    else if (item.imageUrl.startsWith('/generated/')) {
                        // Check if file exists
                        const fullPath = path.join(process.cwd(), "public", item.imageUrl);
                        try {
                            await fs.access(fullPath);
                            imagePath = item.imageUrl;
                        } catch {
                            // File doesn't exist, skip image but keep prompt
                            imagePath = null;
                        }
                    }
                    // If it's a remote URL, try to download
                    else if (item.imageUrl.startsWith('http')) {
                        try {
                            const res = await fetch(item.imageUrl);
                            if (res.ok) {
                                const buffer = await res.arrayBuffer();
                                const contentType = res.headers.get('content-type') || 'image/png';
                                const ext = contentType.split('/')[1] || 'png';
                                const filename = `imported-${Date.now()}-${imported}.${ext}`;
                                const filePath = path.join(publicDir, filename);
                                await fs.writeFile(filePath, Buffer.from(buffer));
                                imagePath = `/generated/${filename}`;
                            }
                        } catch (e) {
                            // Failed to download, keep prompt without image
                        }
                    }
                }

                // Create database entry
                await prisma.promptEntry.create({
                    data: {
                        prompt: item.prompt,
                        negativePrompt: item.negativePrompt || null,
                        imageUrl: imagePath,
                        width: item.width || 1024,
                        height: item.height || 1024,
                        tags: item.tags || null,
                        seed: item.seed || null,
                        cfgScale: item.cfgScale || null,
                        steps: item.steps || null,
                        sampler: item.sampler || null,
                    }
                });

                imported++;
            } catch (e) {
                console.error('Failed to import item:', e);
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            total: data.items.length
        });

    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json(
            { error: error.message || "Import failed" },
            { status: 500 }
        );
    }
}
