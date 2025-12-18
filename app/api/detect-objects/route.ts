import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { imageBase64, apiKey } = await request.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) return NextResponse.json({ error: 'API Key required' }, { status: 401 });

        const client = new GoogleGenAI({ apiKey: key });

        // Gemini 3 Flash is excellent at object detection with [ymin, xmin, ymax, xmax] coordinates
        const detectionPrompt = `
        Detect all interesting objects, characters, and key elements in this image.
        For each detected item, provide a bounding box [ymin, xmin, ymax, xmax] where the values are between 0-1000.
        Also provide a Traditional Chinese (繁體中文) label for each object.
        
        Output ONLY a JSON array of objects:
        [
            {"box_2d": [ymin, xmin, ymax, xmax], "label": "物件名稱"}
        ]
        `;

        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                { text: detectionPrompt },
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
                    }
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text || "");

        try {
            const detections = JSON.parse(text);
            // 確保回傳格式符合前端期望
            return NextResponse.json({ detections: Array.isArray(detections) ? detections : [] });
        } catch (parseErr) {
            console.error("Detection Parse Error:", parseErr, "Raw:", text);
            return NextResponse.json({ error: "Failed to parse detections", raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Object Detection Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
