import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

export const config = {
    api: {
        bodyParser: false,
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

        const client = new GoogleGenAI({ apiKey });

        const results = [];
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

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

                // 2. Structured Analysis with Gemini 3 Flash
                const analysisPrompt = `
Analyze this image for an AI Art Prompt Database.

Output JSON format:
{
    "promptEN": "Detailed English prompt describing the image (80-120 words, include style, lighting, mood, composition)",
    "promptZH": "繁體中文描述",
    "subject": "主體描述",
    "style": "art style (anime, photorealistic, oil painting, etc.)",
    "mood": "mood/atmosphere",
    "lighting": "lighting description",
    "colors": ["dominant", "color", "palette"],
    "tags": ["relevant", "search", "tags", "in", "english"],
    "category": "portrait|landscape|object|abstract|character|scene"
}`;

                const result = await client.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: [
                        { text: analysisPrompt },
                        {
                            inlineData: {
                                data: buffer.toString('base64'),
                                mimeType: file.type || "image/png"
                            }
                        }
                    ],
                    config: {
                        responseMimeType: "application/json"
                    }
                });

                const text = result.text || "";
                let analysisData: {
                    promptEN: string;
                    promptZH: string;
                    tags: string[];
                    style?: string;
                    mood?: string;
                    category?: string;
                } = {
                    promptEN: "",
                    promptZH: "",
                    tags: ["Imported", "Auto-Caption"]
                };

                try {
                    analysisData = JSON.parse(text);
                } catch {
                    analysisData.promptEN = text.trim();
                }

                // 3. Save to DB with rich metadata
                // @ts-ignore
                const entry = await prisma.promptEntry.create({
                    data: {
                        prompt: analysisData.promptEN || text.trim(),
                        originalPrompt: "Batch Import: " + file.name,
                        promptZh: analysisData.promptZH || "",
                        imageUrl: imageUrl,
                        width: 1024,
                        height: 1024,
                        seed: 0,
                        cfgScale: 7,
                        steps: 20,
                        tags: (analysisData.tags || ["Imported"]).join(", "),
                        sampler: "Imported"
                    }
                });

                results.push({
                    status: 'success',
                    id: entry.id,
                    filename: file.name,
                    analysis: {
                        style: analysisData.style || "",
                        mood: analysisData.mood || "",
                        category: analysisData.category || ""
                    }
                });

            } catch (err: any) {
                console.error(`Failed to process ${file.name}:`, err);
                results.push({ status: 'error', filename: file.name, error: err.message });
            }
        }

        return NextResponse.json({
            results,
            summary: {
                total: files.length,
                success: results.filter(r => r.status === 'success').length,
                failed: results.filter(r => r.status === 'error').length
            }
        });

    } catch (error: any) {
        console.error("Batch Import Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
