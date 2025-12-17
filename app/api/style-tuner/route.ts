import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { selectedPromptIds, apiKey } = body; // Expects array of IDs from PromptEntry

        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        if (!selectedPromptIds || !Array.isArray(selectedPromptIds) || selectedPromptIds.length < 3) {
            // Can technically run with fewer, but better with more data
            return NextResponse.json({ error: "Need at least 3 selections for analysis" }, { status: 400 });
        }

        // Fetch prompt details
        // @ts-ignore
        const winningPrompts = await prisma.promptEntry.findMany({
            where: {
                id: { in: selectedPromptIds }
            },
            select: { prompt: true, tags: true, originalPrompt: true }
        });

        const promptTexts = winningPrompts.map((p: any) => p.prompt).join("\n---\n");

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const analysisPrompt = `
        You are an AI Art Curator.
        The user has selected the following image prompts as their favorites (Style Preferences):
        
        ${promptTexts}
        
        TASK:
        1. Analyze the stylistic commonalities between these prompts (e.g., lighting, color palette, artistic medium, mood).
        2. Identify 5-8 highly effective style keywords that define this user's aesthetic taste.
        3. Create a creative "Style Name" for this collection.
        4. Write a brief "Style Description".
        
        Return ONLY a JSON object:
        {
            "styleName": "Creative Name",
            "styleDescription": "Brief description...",
            "keywords": ["tag1", "tag2", "tag3", ...]
        }
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const responseText = result.response.text();
        const analysisData = JSON.parse(responseText);

        return NextResponse.json(analysisData);

    } catch (error: any) {
        console.error("Style Tuner API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
