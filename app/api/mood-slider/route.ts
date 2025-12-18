import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { prompt, mood, intensity, apiKey } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) return NextResponse.json({ error: 'API Key required' }, { status: 401 });

        const client = new GoogleGenAI({ apiKey: key });

        // Mood dimensions (each from -100 to 100)
        const moodDimensions = {
            happiness: mood?.happiness ?? 0,      // -100 (憂鬱) to 100 (歡樂)
            energy: mood?.energy ?? 0,            // -100 (平靜) to 100 (動感)
            warmth: mood?.warmth ?? 0,            // -100 (冷色調) to 100 (暖色調)
            mystery: mood?.mystery ?? 0,          // -100 (清晰) to 100 (神秘)
            drama: mood?.drama ?? 0,              // -100 (平淡) to 100 (戲劇性)
        };

        const intensityLevel = intensity ?? 50; // 0-100, how strongly to apply mood

        const moodPrompt = `
You are an expert AI Art Prompt Engineer specializing in mood and atmosphere control.

Given the original prompt and mood parameters, modify the prompt to reflect the specified emotional atmosphere.

Original Prompt: "${prompt}"

Mood Parameters (scale -100 to +100):
- Happiness: ${moodDimensions.happiness} (negative=melancholic/sad, positive=cheerful/joyful)
- Energy: ${moodDimensions.energy} (negative=calm/serene, positive=dynamic/energetic)
- Warmth: ${moodDimensions.warmth} (negative=cool blue tones, positive=warm orange tones)
- Mystery: ${moodDimensions.mystery} (negative=clear/bright, positive=mysterious/foggy)
- Drama: ${moodDimensions.drama} (negative=subtle/plain, positive=dramatic/intense)

Intensity: ${intensityLevel}% (how strongly to apply these mood changes)

Instructions:
1. Keep the core subject and composition from the original prompt
2. Add mood-specific keywords based on the parameters
3. Adjust lighting, color, and atmosphere descriptions
4. Higher intensity = more dramatic mood changes
5. Zero values for any parameter mean neutral/unchanged for that dimension

Output JSON format:
{
    "modifiedPrompt": "The English prompt with mood adjustments applied",
    "modifiedPromptZH": "繁體中文版本",
    "moodKeywords": ["list", "of", "added", "mood", "keywords"],
    "colorPalette": ["suggested", "color", "terms"],
    "lightingStyle": "description of lighting changes",
    "atmosphereNote": "繁體中文說明情緒調整效果"
}`;

        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ text: moodPrompt }],
            config: {
                responseMimeType: "application/json",
                temperature: 0.7
            }
        });

        const text = response.text || "";

        try {
            const data = JSON.parse(text);
            return NextResponse.json({
                original: prompt,
                modified: data.modifiedPrompt || "",
                modifiedZH: data.modifiedPromptZH || "",
                moodKeywords: data.moodKeywords || [],
                colorPalette: data.colorPalette || [],
                lightingStyle: data.lightingStyle || "",
                atmosphereNote: data.atmosphereNote || "",
                appliedMood: moodDimensions,
                intensity: intensityLevel
            });
        } catch {
            return NextResponse.json({
                original: prompt,
                modified: text.trim()
            });
        }

    } catch (error: any) {
        console.error("Mood Slider Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
