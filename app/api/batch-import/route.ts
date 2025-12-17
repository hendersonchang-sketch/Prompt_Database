import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

export const config = {
    api: {
        bodyParser: false, // Disallow default body parsing for FormData
    },
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const apiKey = formData.get('apiKey') as string;

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const results = [];
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Process files sequentially to avoid hitting rate limits too hard? 
        // Or parallel with limit. Let's do parallel for speed, Gemini 2.0 Flash is fast.

        for (const file of files) {
            try {
                // 1. Save File
                const buffer = Buffer.from(await file.arrayBuffer());
                const timestamp = Date.now();
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
                const filename = `import-${timestamp}-${cleanName}`;
                const filepath = path.join(uploadDir, filename);
                await writeFile(filepath, buffer);
                const imageUrl = `/uploads/${filename}`;

                // 2. Describe with Gemini
                const prompt = `
                Describe this image in detail for an AI Art Prompt Database.
                Includes: Subject, Art Style, Lighting, Color Palette, Mood.
                Output ONLY the prompt text in English.
                `;

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: buffer.toString('base64'),
                            mimeType: file.type || "image/png"
                        }
                    }
                ]);

                const description = result.response.text().trim();

                // 3. Generate Tags (Optional, but useful)
                // We can do a second pass or ask for both in JSON. 
                // Let's stick to simple description for now to save tokens/requests, 
                // or assume description contains keywords.
                // Simple tag extraction from description?
                const tags = ["Imported", "Auto-Caption"];

                // 4. Save to DB
                // @ts-ignore
                const entry = await prisma.promptEntry.create({
                    data: {
                        prompt: description,
                        originalPrompt: "Batch Import: " + file.name,
                        promptZh: "", // Could translate if needed, skip for speed
                        imageUrl: imageUrl,
                        width: 1024, // Unknown really, unless we read metadata. Defaulting.
                        height: 1024,
                        seed: 0,
                        cfgScale: 7,
                        steps: 20,
                        tags: tags.join(", "),
                        sampler: "Imported"
                    }
                });

                results.push({ status: 'success', id: entry.id, filename: file.name });

            } catch (err: any) {
                console.error(`Failed to process ${file.name}:`, err);
                results.push({ status: 'error', filename: file.name, error: err.message });
            }
        }

        return NextResponse.json({ results });

    } catch (error: any) {
        console.error("Batch Import Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
