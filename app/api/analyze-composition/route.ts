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

        const analysisPrompt = `
You are a master Art Director. Analyze the spatial composition of this image.
1. Identify the 1 to 3 most important visual focal points. 
2. For each point, provide a bounding box [ymin, xmin, ymax, xmax] (0-1000 scale) and a short label.
3. Evaluate the overall balance (e.g., Rule of Thirds, Symmetrical, Leaning Left).
4. Provide a "Master Suggestion" on how to improve the composition using specific prompt keywords.

Output ONLY a JSON object:
{
    "focalPoints": [
        {"box_2d": [ymin, xmin, ymax, xmax], "label": "Subject Name"}
    ],
    "balance": "Description in Traditional Chinese",
    "suggestion": "Traditional Chinese description",
    "improvedPrompt": "English professional keywords for improvement"
}
`;

        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                { text: analysisPrompt },
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
            const analysis = JSON.parse(text);
            // 轉換欄位名稱以匹配前端期望的格式
            const result = {
                focal_points: analysis.focalPoints?.map((fp: any) => ({
                    coordinates: fp.box_2d ? [(fp.box_2d[0] + fp.box_2d[2]) / 2, (fp.box_2d[1] + fp.box_2d[3]) / 2] : [500, 500],
                    label: fp.label || ''
                })) || [],
                balance_evaluation: analysis.balance || '',
                prompt_suggestion: analysis.improvedPrompt || analysis.suggestion || ''
            };
            return NextResponse.json(result);
        } catch (parseErr) {
            console.error("Composition Parse Error:", parseErr, "Raw:", text);
            return NextResponse.json({ error: "Failed to parse analysis", raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Composition Analysis Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
