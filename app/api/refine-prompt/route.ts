import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { originalPrompt, critique, score, apiKey } = body;

        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        if (!originalPrompt) {
            return NextResponse.json({ error: "Original prompt is required" }, { status: 400 });
        }

        const client = new GoogleGenAI({ apiKey });

        // Construct Critique Context
        let critiqueText = "";
        if (typeof critique === 'string') {
            critiqueText = critique;
        } else if (Array.isArray(critique)) {
            critiqueText = critique.map((item: any) =>
                `- Priority ${item.priority}: Improve ${item.area} (${item.target}). Suggestion: ${item.action}`
            ).join("\n");
        } else {
            critiqueText = "General improvement needed.";
        }

        const refinementPrompt = `
You are an Expert AI Art Prompt Engineer. Refine a prompt based on critique.

Current Prompt: "${originalPrompt}"
Current Score: ${score}/100

Critique / Areas for Improvement:
${critiqueText}

TASK: Rewrite the prompt addressing the critique while keeping the core subject.

Output JSON format:
{
    "newPrompt": "Refined English prompt (address all critique points)",
    "newPromptZH": "繁體中文版本",
    "changes": [
        {"area": "issue area", "before": "original text", "after": "new text", "reason": "why changed"}
    ],
    "estimatedNewScore": 0,
    "improvements": ["list of improvements made"],
    "suggestions": ["additional suggestions for further refinement"]
}`;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: refinementPrompt }],
            config: {
                responseMimeType: "application/json",
                temperature: 0.5
            }
        });

        const text = response.text || "";

        try {
            const data = JSON.parse(text);
            return NextResponse.json({
                newPrompt: data.newPrompt || "",
                newPromptZH: data.newPromptZH || "",
                changes: data.changes || [],
                estimatedNewScore: data.estimatedNewScore || 0,
                improvements: data.improvements || [],
                suggestions: data.suggestions || []
            });
        } catch {
            return NextResponse.json({ newPrompt: text.trim() });
        }

    } catch (error: any) {
        console.error("Refine Prompt API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
