import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    try {
        const { text, apiKey } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const translatePrompt = `
You are an expert AI Art Prompt Engineer. Translate the following Chinese description into a professional English image generation prompt.

Chinese input: "${text}"

Rules:
- Output ONLY the English prompt, nothing else
- Make it detailed and descriptive for image generation
- Add quality keywords (8K, detailed, professional lighting, etc.)
- Include style and mood descriptors
- Keep it under 100 words
- Do not add NSFW content
- Do not include any Chinese characters
- Do not include explanatory text

English prompt:`;

        const result = await model.generateContent(translatePrompt);
        const response = await result.response;
        const translatedPrompt = response.text().trim();

        return NextResponse.json({
            original: text,
            translated: translatedPrompt
        });

    } catch (error: any) {
        console.error("Translation error:", error);
        return NextResponse.json(
            { error: error.message || "Translation failed" },
            { status: 500 }
        );
    }
}
