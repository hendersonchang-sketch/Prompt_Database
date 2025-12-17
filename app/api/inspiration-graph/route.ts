import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const threshold = parseFloat(searchParams.get('threshold') || '0.75');

        // Fetch recent prompts with embedding
        // @ts-ignore
        const prompts = await prisma.promptEntry.findMany({
            where: {
                NOT: { embedding: null }
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                prompt: true,
                imageUrl: true,
                embedding: true
            }
        });

        const nodes: any[] = [];
        const links: any[] = [];
        const parsedEmbeddings: Record<string, number[]> = {};

        // Prepare Nodes
        for (const p of prompts) {
            nodes.push({
                id: p.id,
                name: p.prompt.substring(0, 50) + "...",
                fullPrompt: p.prompt,
                img: p.imageUrl,
                val: 5 // Default size
            });

            try {
                parsedEmbeddings[p.id] = JSON.parse(p.embedding);
            } catch (e) {
                console.error(`Failed to parse embedding for ${p.id}`);
            }
        }

        // Calculate Edges (O(N^2))
        for (let i = 0; i < prompts.length; i++) {
            for (let j = i + 1; j < prompts.length; j++) {
                const p1 = prompts[i];
                const p2 = prompts[j];
                const vec1 = parsedEmbeddings[p1.id];
                const vec2 = parsedEmbeddings[p2.id];

                if (vec1 && vec2) {
                    const similarity = cosineSimilarity(vec1, vec2);
                    if (similarity >= threshold) {
                        links.push({
                            source: p1.id,
                            target: p2.id,
                            value: similarity
                        });
                    }
                }
            }
        }

        return NextResponse.json({ nodes, links });

    } catch (error: any) {
        console.error('Inspiration Graph Error:', error);
        return NextResponse.json({ error: 'Failed to generate graph' }, { status: 500 });
    }
}
