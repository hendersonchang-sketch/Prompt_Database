import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt, apiKey } = body;

        if (!prompt || !apiKey) {
            return NextResponse.json({ error: 'Missing prompt or API key' }, { status: 400 });
        }

        const client = new GoogleGenAI({ apiKey });

        const systemPrompt = `
You are an expert AI Prompt Engineer.
Your task is to DECONSTRUCT the provided prompt into 3 distinct, reusable components.
These components will be used by the user to maintain consistency (e.g. keeping the same character but changing the scene).

**INPUT PROMPT:**
"${prompt}"

**INSTRUCTIONS:**
1. **subject_prompt**: Extract ONLY the description of the main character(s) or subject. Include physical features, clothing, and facial details. DO NOT include background or lighting here.
2. **style_prompt**: Extract ONLY the artistic style, medium (e.g. photo, oil painting), lighting, camera angles, color palette, and artist names.
3. **scene_prompt**: Extract ONLY the environment, background, location, and action context.

**OUTPUT FORMAT (JSON ONLY):**
{
  "subject_prompt": "...",
  "style_prompt": "...",
  "scene_prompt": "..."
}
`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: systemPrompt }
                    ]
                }
            ],
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            const json = JSON.parse(text);
            return NextResponse.json(json);
        }

        throw new Error("No deconstruction generated");

    } catch (error: any) {
        console.error("Deconstruction failed:", error);
        return NextResponse.json({ error: error.message || 'Deconstruction failed' }, { status: 500 });
    }
}
