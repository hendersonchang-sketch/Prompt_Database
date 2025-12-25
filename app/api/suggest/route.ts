import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { prompt, apiKey } = await request.json();

        if (!prompt || prompt.length < 3) {
            return NextResponse.json({ suggestion: "", suggestions: [] });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) return NextResponse.json({ error: "API Key required" }, { status: 401 });

        const client = new GoogleGenAI({ apiKey: key });

        // 情境感知 - 根據用戶輸入判斷場景
        const promptLower = prompt.toLowerCase();
        let contextHint = "";

        if (promptLower.includes("anime") || promptLower.includes("manga")) {
            contextHint = "Focus on anime/manga art terminology.";
        } else if (promptLower.includes("photo") || promptLower.includes("realistic")) {
            contextHint = "Focus on photography and realistic rendering terms.";
        } else if (promptLower.includes("3d") || promptLower.includes("render")) {
            contextHint = "Focus on 3D rendering and CG terminology.";
        } else if (promptLower.includes("portrait") || promptLower.includes("person")) {
            contextHint = "Focus on portrait and character description.";
        } else if (promptLower.includes("landscape") || promptLower.includes("scene")) {
            contextHint = "Focus on environmental and atmospheric descriptions.";
        }

        const suggestPrompt = `
You are an expert AI Art Prompt Autocomplete assistant for Stable Diffusion and Midjourney.
${contextHint}

User is typing: "${prompt}"

Provide 3 different completion suggestions to naturally continue this prompt.
Each suggestion should:
- Add 5-15 words of professional AI art keywords
- NOT repeat what was already typed
- Be different from each other (varied styles/angles/details)

Output ONLY a JSON object:
{
    "primary": "best single completion phrase",
    "suggestions": [
        "completion option 1",
        "completion option 2", 
        "completion option 3"
    ],
    "category": "detected category: portrait|landscape|object|anime|3d|photo|abstract"
}`;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: suggestPrompt }],
            config: {
                responseMimeType: "application/json",
                maxOutputTokens: 150,
                temperature: 0.7,
            }
        });

        const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text || "");

        try {
            const data = JSON.parse(text);
            return NextResponse.json({
                suggestion: data.primary || "",
                suggestions: data.suggestions || [],
                category: data.category || "unknown"
            });
        } catch {
            // 回退：直接使用純文字
            const cleanSuggestion = text.replace(/^[:\"' ]+/, "").replace(/[:\"' ]+$/, "").trim();
            return NextResponse.json({ suggestion: cleanSuggestion, suggestions: [] });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
