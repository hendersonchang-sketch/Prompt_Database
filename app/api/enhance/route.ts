import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { prompt, apiKey } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const client = new GoogleGenAI({ apiKey: key });

        const enhancePrompt = `
You are an expert AI Art Prompt Engineer. Transform a simple user description into a professional, detailed prompt optimized for AI image generation (Stable Diffusion, Midjourney, Imagen).

User's simple description: "${prompt}"

Analyze and enhance by adding:
1. Subject details (appearance, pose, expression)
2. Art style (photorealistic, anime, oil painting, 3D render, etc.)
3. Lighting and atmosphere  
4. Camera angle and composition
5. Quality keywords (8K, highly detailed, sharp focus)
6. Mood and color palette

Output JSON format:
{
    "enhanced": "Complete enhanced English prompt (80-120 words)",
    "enhancedZH": "繁體中文版本的增強描述",
    "additions": {
        "style": "detected/added art style",
        "lighting": "added lighting description",
        "camera": "added camera/composition details",
        "quality": "added quality keywords"
    },
    "promptScore": {
        "before": 0,
        "after": 0,
        "improvement": "explanation of improvements"
    },
    "tags": ["key", "descriptor", "tags"]
}`;

        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ text: enhancePrompt }],
            config: {
                responseMimeType: "application/json",
                temperature: 0.6
            }
        });

        const text = response.text || "";

        try {
            const data = JSON.parse(text);
            return NextResponse.json({
                original: prompt,
                enhanced: data.enhanced || "",
                enhancedZH: data.enhancedZH || "",
                additions: data.additions || {},
                promptScore: data.promptScore || {},
                tags: data.tags || []
            });
        } catch {
            return NextResponse.json({
                original: prompt,
                enhanced: text.trim()
            });
        }

    } catch (error: any) {
        console.error("Enhance error:", error);
        return NextResponse.json(
            { error: error.message || "Enhancement failed" },
            { status: 500 }
        );
    }
}
