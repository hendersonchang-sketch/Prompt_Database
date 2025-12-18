import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { imageBase64, topic, mimeType, apiKey } = await request.json();

        // Use provided API key or fallback to env var
        const key = apiKey || process.env.GEMINI_API_KEY;

        if (!key) {
            return NextResponse.json({ error: 'API Key is required' }, { status: 401 });
        }

        const client = new GoogleGenAI({ apiKey: key });

        let prompt = "";
        let inputParts: any[] = [];

        if (imageBase64) {
            // Vision Mode
            prompt = `
            You are a legendary Meme God and internet humor expert. 
            Look at this image and generate 5 HILARIOUS, creative, and viral-worthy meme captions.
            
            ${topic ? `Context/Topic: "${topic}"` : ""}
            
            Rules:
            1. Captions should be punchy and relatable.
            2. Match the vibe of the image (sarcastic, wholesome, chaotic, etc.).
            3. If a specific context is provided, strictly follow it.
            4. Output strictly a JSON object with this schema: { "captions": ["string", "string", ...] }
            5. Use Traditional Chinese (繁體中文) for the captions unless the context implies otherwise.
            `;

            inputParts = [
                { text: prompt },
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType || "image/png",
                    },
                },
            ];
        } else {
            // Text Mode
            prompt = `
            You are a legendary Meme God. 
            Generate 5 HILARIOUS meme caption ideas based on this topic: "${topic || "programming humor"}".
            
            Rules:
            1. Captions must be funny and relatable.
            2. Output strictly a JSON object with this schema: { "captions": ["string", "string", ...] }
            3. Use Traditional Chinese (繁體中文).
            `;

            inputParts = [{ text: prompt }];
        }

        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: inputParts,
            config: {
                responseMimeType: "application/json",
            }
        });
        const text = response.text || JSON.stringify(response.candidates?.[0]?.content?.parts?.[0]?.text || "");

        // Parse JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            // Fallback simplistic parsing if JSON mode fails slightly
            const match = text.match(/\[[\s\S]*\]/);
            if (match) {
                data = { captions: JSON.parse(match[0]) };
            } else {
                throw new Error("Failed to parse AI response");
            }
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Meme Gen error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate memes' }, { status: 500 });
    }
}
