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

        // 👑 UPGRADE: Switching to Gemini 1.5 Pro for maximum reasoning capability
        const client = new GoogleGenAI({ apiKey: key });

        // 🧠 Dynamic Chain-of-Thought System Prompt
        const enhancePrompt = `
You are a World-Class AI Art Director and Prompt Engineer (specializing in Midjourney v6, Stable Diffusion XL, and Imagen 3).
Your goal is to transform a simple user concept into a "Masterpiece Level" image prompt using a meaningful Chain-of-Thought process.

User's Input: "${prompt}"

### 🧠 YOUR THINKING PROCESS (Chain of Thought):
1.  **Analyze the Subject:** What is the core subject? What is the vibe (e.g., mysterious, cheerful, epic)?
2.  **Determine the Category & Strategy:**
    *   *Portrait:* Focus on skin texture, 85mm lens, eyes, emotion.
    *   *Landscape:* Focus on atmosphere, 14mm wide angle, lighting, clouds.
    *   *Sci-Fi/Cyberpunk:* Focus on neon, reflections, futuristic materials.
    *   *Product:* Focus on studio lighting, sharp details, clean background.
3.  **Select Technical Specs:** Choose the specific camera, lens, and lighting that best fits the subject (not just random words).
4.  **Draft the Prompt:** Construct a cohesive narrative description, not just a list of tags.

### 🎯 OUTPUT REQUIREMENT (JSON):
Generate a JSON response. The 'enhanced' prompt must be in English.
The 'enhancedZH' should be a Traditional Chinese (Taiwan) translation of the enhanced prompt.

{
    "enhanced": "A highly detailed, narrative-driven prompt in English. (80-150 words). Start with the subject, then environment, then lighting/mood, then technical specs.",
    "enhancedZH": "繁體中文版本的完整 Prompt，語氣要優美通順",
    "additions": {
        "style": "The specific art style used (e.g., 'Cinematic Realism', 'Impressionist Oil')",
        "lighting": "The lighting setup used (e.g., 'Volumetric God Rays', 'Neon Rim Light')",
        "camera": "Camera/Lens specs used (e.g., '85mm f/1.8', 'IMAX 70mm')",
        "quality": "Quality keywords used"
    },
    "promptScore": {
        "before": 30,
        "after": 95,
        "improvement": "Briefly explain what you added (e.g., 'Added dramatic lighting and defined a cyberpunk setting')"
    },
    "tags": ["key", "descriptive", "tags", "max", "5"]
}
`;

        const response = await client.models.generateContent({
            // 🚀 Upgraded to Gemini 2.5 Pro (Superior to 1.5 Pro)
            model: "gemini-2.5-pro",
            contents: [{ text: enhancePrompt }],
            config: {
                responseMimeType: "application/json",
                // Higher temperature for more creativity in art direction
                temperature: 0.75
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
            // Fallback if JSON parsing fails (rare with 1.5 Pro)
            return NextResponse.json({
                original: prompt,
                enhanced: text.trim(),
                enhancedZH: "解析失敗，請重試",
                additions: {},
                promptScore: {},
                tags: []
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
