import { NextResponse } from "next/server";
import { PrismaClient, PromptEntry } from "@prisma/client";
import archiver from "archiver";
import { Readable, PassThrough } from "stream";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';


// Helper to convert stream to buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

async function downloadImage(url: string): Promise<Buffer | null> {
    try {
        // Handle data URLs (base64)
        if (url.startsWith("data:")) {
            const base64Data = url.split(",")[1];
            return Buffer.from(base64Data, "base64");
        }

        // Handle relative URLs (local files)
        let fetchUrl = url;
        if (url.startsWith("/")) {
            // Assume it's a local file relative to the public directory in dev/prod
            // BUT for fetch, we need a full URL. During build time, this is tricky.
            // Better approach: Read from filesystem directly if it's a local file.
            const fs = require('fs');
            const path = require('path');

            // Construct absolute filesystem path
            // assuming url starts with /uploads/...
            const localPath = path.join(process.cwd(), 'public', url);

            if (fs.existsSync(localPath)) {
                return fs.readFileSync(localPath);
            } else {
                console.warn(`Local file not found: ${localPath}`);
                return null;
            }
        }

        // Handle remote URLs
        const response = await fetch(fetchUrl, {
            signal: AbortSignal.timeout(10000) // 10s timeout
        });
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error(`Failed to download image: ${url}`, error);
        return null; // Don't crash the entire zip process
    }
}

export async function GET() {
    try {
        // Fetch all prompts
        const prompts = await prisma.promptEntry.findMany({
            orderBy: { createdAt: "desc" }
        });

        // Create archive
        const archive = archiver("zip", {
            zlib: { level: 5 } // Compression level
        });

        const passthrough = new PassThrough();
        archive.pipe(passthrough);

        // Prepare metadata with image filenames
        const metadata = {
            exportDate: new Date().toISOString(),
            totalItems: prompts.length,
            items: [] as any[]
        };

        // Process each prompt
        for (let i = 0; i < prompts.length; i++) {
            const p = prompts[i];
            const imageFilename = p.imageUrl ? `images/${p.id}.png` : null;

            // Add to metadata
            metadata.items.push({
                id: p.id,
                prompt: p.prompt,
                promptZh: p.promptZh,
                originalPrompt: p.originalPrompt,
                negativePrompt: p.negativePrompt,
                imageFile: imageFilename, // Reference to file in ZIP
                imageUrl: p.imageUrl,   // Original URL for reference
                width: p.width,
                height: p.height,
                tags: p.tags,
                isFavorite: p.isFavorite,
                seed: p.seed,
                cfgScale: p.cfgScale,
                steps: p.steps,
                sampler: p.sampler,
                createdAt: p.createdAt
            });

            // Download and add image to archive
            if (p.imageUrl) {
                const imageBuffer = await downloadImage(p.imageUrl);
                if (imageBuffer) {
                    archive.append(imageBuffer, { name: `images/${p.id}.png` });
                }
            }
        }

        // Add metadata JSON
        archive.append(JSON.stringify(metadata, null, 2), { name: "metadata.json" });

        // Add a README
        const readme = `# Prompt Database Backup
Exported: ${new Date().toLocaleString()}
Total Items: ${prompts.length}

## Contents
- metadata.json: All prompt data and settings
- images/: All generated images (named by ID)

## Restore
Use the "匯入" (Import) function in the Prompt Database app to restore this backup.
`;
        archive.append(readme, { name: "README.txt" });

        // Finalize archive
        await archive.finalize();

        // Convert to buffer
        const buffer = await streamToBuffer(passthrough);

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="prompt-database-backup-${Date.now()}.zip"`,
                "Content-Length": buffer.length.toString()
            }
        });

    } catch (error: any) {
        console.error("ZIP Export error:", error);
        return NextResponse.json(
            { error: error.message || "ZIP Export failed" },
            { status: 500 }
        );
    }
}
