import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { promptA, promptB, imageA, imageB, apiKey } = await request.json();

        if (!promptA && !imageA) {
            return NextResponse.json({ error: 'At least promptA or imageA is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) return NextResponse.json({ error: 'API Key required' }, { status: 401 });

        const client = new GoogleGenAI({ apiKey: key });

        // Build content parts
        const parts: any[] = [];

        const comparePrompt = `
You are an expert AI Art Prompt Analyst. Compare two prompts/images and analyze their "DNA" - the essential elements that define each.

${promptA ? `Prompt A: "${promptA}"` : "Image A is provided below."}
${promptB ? `Prompt B: "${promptB}"` : imageB ? "Image B is provided below." : ""}

Analyze and compare these elements:
1. **Subject** - Main subject/character
2. **Style** - Art style, rendering approach
3. **Lighting** - Light source, shadows, mood
4. **Color** - Palette, saturation, contrast
5. **Composition** - Framing, perspective, focus
6. **Mood** - Emotional atmosphere
7. **Detail Level** - Specificity, complexity
8. **Technical Keywords** - Quality modifiers

Output JSON format:
{
    "promptA_DNA": {
        "subject": "description",
        "style": "description",
        "lighting": "description",
        "color": "description",
        "composition": "description",
        "mood": "description",
        "detailLevel": 0-100,
        "technicalKeywords": ["list"]
    },
    "promptB_DNA": {
        "subject": "description",
        "style": "description",
        "lighting": "description",
        "color": "description",
        "composition": "description",
        "mood": "description",
        "detailLevel": 0-100,
        "technicalKeywords": ["list"]
    },
    "comparison": {
        "similarities": ["list of similar elements"],
        "differences": [
            {"element": "subject", "a": "A's approach", "b": "B's approach", "impact": "繁體中文影響說明"}
        ],
        "overallSimilarity": 0-100,
        "styleDistance": "how different the styles are"
    },
    "insights": {
        "whyAWorks": "繁體中文 - 為什麼 A 的寫法有效",
        "whyBWorks": "繁體中文 - 為什麼 B 的寫法有效",
        "combinationTip": "繁體中文 - 如何結合兩者的優點",
        "learningPoints": ["繁體中文學習要點"]
    },
    "fusionPrompt": "A suggested prompt that combines the best of both"
}`;

        parts.push({ text: comparePrompt });

        // Add images if provided
        if (imageA) {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageA.replace(/^data:image\/[a-z]+;base64,/, '')
                }
            });
        }
        if (imageB) {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageB.replace(/^data:image\/[a-z]+;base64,/, '')
                }
            });
        }

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: parts,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text || "";

        try {
            const analysis = JSON.parse(text);
            return NextResponse.json(analysis);
        } catch (parseErr) {
            console.error("DNA Compare Parse Error:", parseErr, "Raw:", text);
            return NextResponse.json({ error: "Failed to parse comparison", raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error("DNA Compare Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
