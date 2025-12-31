import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageBase64, apiKey } = body;

        if (!imageBase64 || !apiKey) {
            return NextResponse.json({ error: 'Missing image or API key' }, { status: 400 });
        }

        const client = new GoogleGenAI({ apiKey });

        const systemPrompt = `
You are an expert AI Visual Analyzer for generative art. 
Your task is to analyze the provided image and extract its visual parameters into a structured JSON format.
This JSON will be used by other AI systems to replicate the style and composition.

**REQUIREMENTS:**
1. **Output Format**: Pure JSON only. No markdown formatting.
2. **Language**: All values must have both 'en' (English) and 'zh' (Traditional Chinese) fields.
3. **Structure**:
   - **style**: The overall artistic style (e.g., Cyberpunk, Ukiyo-e, Oil Painting).
   - **layout**: The visual arrangement (e.g., Symmetrical, Chaotic, Minimalist).
   - **composition**: Specific rules used (e.g., Rule of Thirds, Golden Ratio, Dutch Angle).
   - **lighting**: Light source and quality (e.g., Volumetric, Rembrant, Neon).
   - **palette**: Dominant colors (Hex codes + Names).
   - **subject**: The main focal point description.
   - **scene**: The background and environment.
   - **effects**: Special visual effects (e.g., Bokeh, Glitch, Motion Blur).
   - **mood**: The emotional atmosphere.
   - **reverse_engineering**:
     - **subject_prompt**: A precise, short prompt string to recreate ONLY the character/subject (English).
     - **style_prompt**: A precise, short prompt string to recreate ONLY the style (English).
     - **scene_prompt**: A precise, short prompt string to recreate ONLY the environment (English).

**EXAMPLE JSON:**
{
  "style": { "en": "Cyberpunk", "zh": "賽博龐克" },
  "layout": { "en": "Centered Portrait", "zh": "置中肖像" },
  "composition": { "en": "Low Angle Shot", "zh": "低角度拍攝" },
  "lighting": { "en": "Neon Blue & Pink Side Lighting", "zh": "霓虹藍粉側光" },
  "subject": { "en": "Female Android with transparent skin", "zh": "透明皮膚的女性仿生人" },
  "scene": { "en": "Rainy futuristic Tokyo street", "zh": "雨天的未來東京街道" },
  "effects": { "en": "Chromatic Aberration, Lens Flare", "zh": "色差, 鏡頭光暈" },
  "mood": { "en": "Melancholic, High-tech", "zh": "憂鬱, 高科技" },
  "reverse_engineering": {
      "subject_prompt": "A female android with transparent skin, glowing circuitry, silver hair",
      "style_prompt": "Cyberpunk style, neon lighting, cinematic, high contrast, ray tracing",
      "scene_prompt": "Rainy Tokyo street at night, wet asphalt, reflections of neon signs"
  }
}
`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: systemPrompt },
                        {
                            inlineData: {
                                data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                                mimeType: 'image/png'
                            }
                        }
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

        throw new Error("No analysis generated");

    } catch (error: any) {
        console.error("JSON Analysis failed:", error);
        return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
    }
}
