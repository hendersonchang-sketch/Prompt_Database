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

        const cropPrompt = `
You are an expert photo editor and composition analyst.

Analyze this image and provide smart cropping suggestions for different aspect ratios and use cases.

For EACH crop suggestion:
1. Identify the main subject(s) and their bounding box
2. Calculate the optimal crop region that keeps the subject well-composed
3. Apply the Rule of Thirds when possible
4. Avoid cutting off important elements

Output JSON format:
{
    "mainSubject": {
        "description": "What is the main subject",
        "boundingBox": [ymin, xmin, ymax, xmax]
    },
    "crops": [
        {
            "name": "Instagram Post",
            "ratio": "1:1",
            "region": [ymin, xmin, ymax, xmax],
            "reason": "繁體中文說明為何這樣裁切",
            "focusPoint": [centerY, centerX]
        },
        {
            "name": "Instagram Story / TikTok",
            "ratio": "9:16",
            "region": [ymin, xmin, ymax, xmax],
            "reason": "繁體中文說明",
            "focusPoint": [centerY, centerX]
        },
        {
            "name": "YouTube Thumbnail",
            "ratio": "16:9",
            "region": [ymin, xmin, ymax, xmax],
            "reason": "繁體中文說明",
            "focusPoint": [centerY, centerX]
        },
        {
            "name": "Profile Picture",
            "ratio": "1:1",
            "region": [ymin, xmin, ymax, xmax],
            "reason": "繁體中文說明 - 緊密裁切主體臉部",
            "focusPoint": [centerY, centerX]
        },
        {
            "name": "Banner / Cover",
            "ratio": "3:1",
            "region": [ymin, xmin, ymax, xmax],
            "reason": "繁體中文說明",
            "focusPoint": [centerY, centerX]
        }
    ],
    "compositionNotes": "繁體中文構圖建議",
    "warnings": ["如有重要元素被裁切的警告"]
}

All coordinates are in 0-1000 scale.
`;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { text: cropPrompt },
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

        const text = response.text || "";

        try {
            const analysis = JSON.parse(text);
            return NextResponse.json(analysis);
        } catch (parseErr) {
            console.error("Smart Crop Parse Error:", parseErr, "Raw:", text);
            return NextResponse.json({ error: "Failed to parse crop analysis", raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Smart Crop Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
