import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const enhancePrompt = `
You are an expert AI Art Prompt Engineer. The user has provided a simple description, and your job is to expand it into a detailed, professional prompt for image generation (like Stable Diffusion, Midjourney, or Imagen).

User's simple description: "${prompt}"

Please enhance this into a detailed prompt by adding:
1. Subject details (appearance, pose, expression if applicable)
2. Art style (photorealistic, anime, oil painting, 3D render, etc.)
3. Lighting and atmosphere
4. Camera angle and composition
5. Quality keywords (8K, highly detailed, sharp focus, etc.)

Rules:
- Output ONLY the enhanced English prompt, nothing else
- Keep it concise but comprehensive (under 100 words)
- Maintain the user's original intent
- Do not add NSFW content
- Do not include "prompt:" or explanatory text

Enhanced prompt:`;

        const result = await model.generateContent(enhancePrompt);
        const response = await result.response;
        const enhancedPrompt = response.text().trim();

        return NextResponse.json({
            original: prompt,
            enhanced: enhancedPrompt
        });

    } catch (error: any) {
        console.error("Enhance error:", error);
        return NextResponse.json(
            { error: error.message || "Enhancement failed" },
            { status: 500 }
        );
    }
}
