import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { imageBase64, productName, apiKey } = await request.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) return NextResponse.json({ error: 'API Key required' }, { status: 401 });

        const client = new GoogleGenAI({ apiKey: key });

        const explodedPrompt = `
You are an expert product designer and technical illustrator specializing in exploded view diagrams.

Analyze this product image and identify all visible components/parts for creating an exploded view illustration.

${productName ? `Product Name: ${productName}` : ''}

For EACH component you identify:
1. Provide its bounding box coordinates [ymin, xmin, ymax, xmax] in 0-1000 scale
2. Describe the component
3. Estimate its material
4. Suggest its purpose/function
5. Assign a layer number (center=1, outer layers=2,3,4...)

Output JSON format:
{
    "productName": "Identified or given product name",
    "productCategory": "electronics | mechanical | furniture | accessory | vehicle | other",
    "totalParts": 0,
    "components": [
        {
            "id": 1,
            "name": "Component name (English)",
            "nameZH": "零件名稱（繁體中文）",
            "boundingBox": [ymin, xmin, ymax, xmax],
            "material": "plastic | metal | glass | fabric | rubber | wood | ceramic | other",
            "function": "What this part does",
            "layer": 1,
            "color": "dominant color",
            "connectionPoints": ["where it connects to other parts"]
        }
    ],
    "assemblyOrder": [1, 2, 3],
    "explodedViewPromptEN": "Detailed English prompt for generating an exploded view illustration of this product, isometric view, technical illustration style, numbered parts, clean white background, professional product visualization",
    "explodedViewPromptZH": "繁體中文版本的爆炸視圖生成提示詞",
    "technicalNotes": "繁體中文技術說明與組裝順序建議",
    "suggestedStyles": [
        {
            "style": "Technical Blueprint",
            "prompt": "exploded view, technical blueprint style, CAD drawing, precise lines, measurement annotations"
        },
        {
            "style": "3D Isometric",
            "prompt": "exploded view, 3D isometric render, floating parts, soft shadows, gradient background"
        },
        {
            "style": "Clean Product Shot",
            "prompt": "exploded view, product photography style, studio lighting, white background, high detail"
        }
    ]
}

Be thorough - identify even small components like screws, buttons, and connectors.
`;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { text: explodedPrompt },
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
            console.error("Exploded View Parse Error:", parseErr, "Raw:", text);
            return NextResponse.json({ error: "Failed to parse analysis", raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Exploded View Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
