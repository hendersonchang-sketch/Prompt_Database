import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { prompt, count = 3, apiKey } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const client = new GoogleGenAI({ apiKey: key });

        const batchPrompt = `
You are an expert AI Art Prompt Engineer. Create ${count} DISTINCT creative variations of the given prompt.

Original prompt: "${prompt}"

For each variation, vary these elements:
- Scene/Environment (beach, city, forest, cafe, space)
- Art Style (anime, oil painting, watercolor, 3D, pixel art, cyberpunk)
- Season/Weather (spring, summer, autumn, winter, rain, snow)
- Time of Day (sunrise, noon, sunset, night, golden hour)
- Camera (close-up, medium shot, wide shot, bird's eye)
- Mood (happy, sad, mysterious, romantic, tense)

Output JSON format:
{
    "variations": [
        {
            "en": "English variation prompt (detailed, 60-100 words)",
            "zh": "繁體中文描述",
            "changes": ["scene: beach", "style: watercolor"],
            "tags": ["key", "tags"]
        }
    ]
}

Rules:
- Create exactly ${count} variations
- Each must be distinctly different
- Include quality keywords (8K, detailed, etc.)
- No NSFW content
- Each variation should have unique combination of changes`;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: batchPrompt }],
            config: {
                responseMimeType: "application/json",
                temperature: 0.9
            }
        });

        const text = response.text || "";

        try {
            const data = JSON.parse(text);
            const variations = (data.variations || []).slice(0, count);

            return NextResponse.json({
                original: prompt,
                variations: variations,
                count: variations.length
            });
        } catch {
            // Fallback: Parse old format
            const variationBlocks = text.split(/\n\n+/).filter(b => b.includes('[EN]'));
            const variations: { en: string; zh: string }[] = [];

            for (const block of variationBlocks) {
                const enMatch = block.match(/\[EN\]\s*([\s\S]+?)(?=\[ZH\]|$)/);
                const zhMatch = block.match(/\[ZH\]\s*([\s\S]+?)$/);
                if (enMatch && zhMatch) {
                    variations.push({
                        en: enMatch[1].trim(),
                        zh: zhMatch[1].trim()
                    });
                }
            }

            return NextResponse.json({
                original: prompt,
                variations: variations.slice(0, count),
                count: Math.min(variations.length, count)
            });
        }

    } catch (error: any) {
        console.error("Batch variation error:", error);
        return NextResponse.json(
            { error: error.message || "Batch variation failed" },
            { status: 500 }
        );
    }
}
