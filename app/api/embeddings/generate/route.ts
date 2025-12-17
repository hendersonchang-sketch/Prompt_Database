import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to calculate cosine similarity
export function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(request: Request) {
    try {
        const { id, apiKey } = await request.json();

        if (!id || !apiKey) {
            return NextResponse.json({ error: 'Missing id or apiKey' }, { status: 400 });
        }

        // 1. Get Prompt
        // @ts-ignore
        const entry = await prisma.promptEntry.findUnique({
            where: { id }
        });

        if (!entry) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        const textToEmbed = entry.prompt + (entry.promptZh ? " " + entry.promptZh : "");

        // 2. Call Gemini Embedding API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: {
                    parts: [{ text: textToEmbed }]
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${await response.text()}`);
        }

        const data = await response.json();
        const embeddingValues = data.embedding?.values;

        if (!embeddingValues) {
            throw new Error('No embedding values returned');
        }

        // 3. Save to DB
        // @ts-ignore
        await prisma.promptEntry.update({
            where: { id },
            data: {
                embedding: JSON.stringify(embeddingValues)
            }
        });

        return NextResponse.json({ success: true, embeddingLength: embeddingValues.length });

    } catch (error: any) {
        console.error("Embedding Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
