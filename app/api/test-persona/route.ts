
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { systemPrompt, userPrompt, apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "API Key required" }, { status: 400 });
        }

        const systemInstruction = systemPrompt + "\n\nUser Input: " + userPrompt;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${errText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

        return NextResponse.json({ enhancedPrompt: text });
    } catch (e: any) {
        console.error("Test Persona Error", e);
        return NextResponse.json({ error: e.message || "Enhancement failed" }, { status: 500 });
    }
}
