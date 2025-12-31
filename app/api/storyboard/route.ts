import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { images, apiKey } = await request.json(); // images is an array of { base64, mimeType }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) return NextResponse.json({ error: 'API Key required' }, { status: 401 });

        const client = new GoogleGenAI({ apiKey: key });

        // Build parts for the multi-modal prompt
        const inputParts: any[] = [
            {
                text: `
                You are a Storyboard Orchestrator and Creative Director.
                I am providing you with a sequence of images. 
                1. Analyze each image's content.
                2. Evaluate the consistency of characters, style, and setting across all images.
                3. Write a coherent story script (傳統中文) based on these images.
                4. Predict what should happen in the "Next Scene" to continue the story.
                5. Provide "Consistency Score" (0-100) and specific advice to improve prompt consistency.

                Output strictly a JSON object:
                {
                    "summary": "Overall story summary in Traditional Chinese",
                    "consistency": {
                        "score": number,
                        "analysis": "Consistency analysis in Traditional Chinese"
                    },
                    "script": [
                        {"scene": number, "description": "Action/Dialogue in Traditional Chinese"}
                    ],
                    "nextScene": "Description of the next recommended scene",
                    "consistencyAdvice": "Tips for improving consistency"
                }
                `
            }
        ];

        // Add each image to parts
        images.forEach((img: any, index: number) => {
            inputParts.push({
                inlineData: {
                    mimeType: img.mimeType || 'image/jpeg',
                    data: img.base64.replace(/^data:image\/[a-z]+;base64,/, '')
                }
            });
        });

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: inputParts,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text || "");

        try {
            const analysis = JSON.parse(text);
            return NextResponse.json(analysis);
        } catch (parseErr) {
            console.error("Storyboard Parse Error:", parseErr, "Raw:", text);
            return NextResponse.json({ error: "Failed to parse story analysis", raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Storyboard Orchestrator Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
