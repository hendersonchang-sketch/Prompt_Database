import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt, apiKey } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        const client = new GoogleGenAI({ apiKey: key });

        const systemPrompt = `You are an expert prompt analyst. Analyze the given image generation prompt and break it down into a structured JSON format with BOTH English and Chinese (繁體中文) descriptions.

Return ONLY valid JSON (no markdown, no code blocks, just raw JSON) with this exact structure:

{
  "title": "A short descriptive title / 簡短標題",
  "title_zh": "中文標題",
  "subject": {
    "main_element": "The main subject/object",
    "main_element_zh": "主體中文描述",
    "orientation": "Position or pose",
    "orientation_zh": "位置或姿態",
    "details": ["detail 1", "detail 2"],
    "details_zh": ["細節1", "細節2"]
  },
  "environment": {
    "setting": "The background/location",
    "setting_zh": "場景中文",
    "elements": ["element 1", "element 2"],
    "elements_zh": ["元素1", "元素2"]
  },
  "action": ["action 1", "action 2"],
  "action_zh": ["動作1", "動作2"],
  "style": {
    "camera_view": "Camera angle/view",
    "camera_view_zh": "鏡頭角度",
    "technique": "Photography/art technique",
    "technique_zh": "技術手法",
    "lighting": "Lighting description",
    "lighting_zh": "光線描述",
    "atmosphere": "Mood/atmosphere",
    "atmosphere_zh": "氛圍"
  },
  "colors": ["color 1", "color 2"],
  "colors_zh": ["顏色1", "顏色2"],
  "quality_tags": ["quality tag 1", "quality tag 2"],
  "quality_tags_zh": ["品質標籤1", "品質標籤2"]
}

If a field is not present in the prompt, use null or an empty array. Be concise but accurate. The Chinese translations should be natural Traditional Chinese.`;

        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                { text: systemPrompt },
                { text: `Analyze this prompt:\n\n${prompt}` }
            ]
        });

        const responseText = response.text ? response.text : "{}";

        // Try to parse as JSON
        let structured;
        try {
            // Remove any markdown code block markers if present
            const cleaned = responseText
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/gi, '')
                .trim();
            structured = JSON.parse(cleaned);
        } catch (parseError) {
            // If parsing fails, return the raw text
            return NextResponse.json({
                error: "Failed to parse structured response",
                raw: responseText
            }, { status: 200 });
        }

        return NextResponse.json({ structured });

    } catch (error: any) {
        console.error("Parse prompt error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to parse prompt" },
            { status: 500 }
        );
    }
}
