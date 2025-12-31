import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { imageBase64, existingTags, apiKey } = await request.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) return NextResponse.json({ error: 'API Key required' }, { status: 401 });

        const client = new GoogleGenAI({ apiKey: key });

        const tagPrompt = `
You are an expert AI Art Tagger and Classifier. Analyze this image and generate comprehensive, hierarchical tags for an AI Art Prompt Database.

${existingTags ? `Existing tags: ${existingTags}` : ''}

Generate tags in these categories:

1. **Primary Category** (pick ONE): portrait | landscape | character | object | abstract | scene | architecture | vehicle | food | animal | fashion | fantasy | scifi

2. **Style Tags**: Art style, rendering technique, era
3. **Subject Tags**: Main subjects, characters, objects
4. **Mood Tags**: Emotional atmosphere, feeling
5. **Color Tags**: Dominant colors, color scheme
6. **Technical Tags**: Camera, lighting, composition
7. **Quality Tags**: Resolution, detail level descriptors
8. **Theme Tags**: Theme, genre, setting

Output JSON format:
{
    "primaryCategory": "portrait",
    "confidence": 0.95,
    "hierarchicalTags": {
        "style": ["photorealistic", "studio portrait", "high fashion"],
        "subject": ["woman", "model", "close-up face"],
        "mood": ["elegant", "mysterious", "confident"],
        "color": ["warm tones", "golden", "brown", "cream"],
        "technical": ["soft lighting", "shallow depth of field", "85mm lens"],
        "quality": ["8K", "highly detailed", "sharp focus"],
        "theme": ["beauty", "fashion", "editorial"]
    },
    "flatTags": ["woman", "portrait", "elegant", "photorealistic", "warm tones", "studio lighting"],
    "suggestedCollections": ["Portraits", "Fashion", "Editorial"],
    "similarityKeywords": ["fashion photography", "beauty shot", "model portrait"],
    "promptRelevantTags": "Tags optimized for AI image generation prompts",
    "descriptionZH": "繁體中文的簡短圖片描述（一句話）"
}

Be specific and use professional terminology. Include both English tags and ensure they are useful for AI art generation.
`;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { text: tagPrompt },
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

            // 計算總標籤數
            let totalTags = 0;
            if (analysis.hierarchicalTags) {
                Object.values(analysis.hierarchicalTags).forEach((tags: any) => {
                    if (Array.isArray(tags)) totalTags += tags.length;
                });
            }

            return NextResponse.json({
                ...analysis,
                totalTags,
                generatedAt: new Date().toISOString()
            });
        } catch (parseErr) {
            console.error("Auto-Tag Parse Error:", parseErr, "Raw:", text);
            return NextResponse.json({ error: "Failed to parse tags", raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Auto-Tag Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
