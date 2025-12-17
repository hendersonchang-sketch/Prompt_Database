import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash-exp" });

        const batchPrompt = `
You are an expert AI Art Prompt Engineer. Given an original image prompt, create ${count} DIFFERENT creative variations.

Original prompt: "${prompt}"

For each variation, pick a DIFFERENT combination of changes from these categories:
- Scene/Environment (beach, city, forest, cafe, space, etc.)
- Art Style (anime, oil painting, watercolor, 3D, pixel art, cyberpunk)
- Season (spring, summer, autumn, winter)
- Time of Day (sunrise, noon, sunset, night, rain)
- Camera Distance (close-up, medium shot, wide shot, bird's eye)
- Mood (happy, sad, mysterious, romantic, tense)

Output format for EACH variation (use this exact format):
[EN] English prompt here
[ZH] 繁體中文描述在這裡

Rules:
- Create ${count} variations total
- Each variation must have BOTH [EN] and [ZH] lines
- English prompt should be detailed (under 100 words)
- Chinese should be a natural translation/description
- Each variation should be distinctly different
- Maintain quality keywords in English (8K, detailed, etc.)
- Do not add NSFW content
- Separate each variation with a blank line

${count} Variations:`;

        const result = await model.generateContent(batchPrompt);
        const response = await result.response;
        const text = response.text().trim();

        // Parse the format: [EN] ... [ZH] ...
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

    } catch (error: any) {
        console.error("Batch variation error:", error);
        return NextResponse.json(
            { error: error.message || "Batch variation failed" },
            { status: 500 }
        );
    }
}
