import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const { image, imageUrl, apiKey, characterOnly = false } = await request.json();

        let base64Data = '';

        // Handle imageUrl by fetching and converting to base64
        if (imageUrl && !image) {
            try {
                const imageResponse = await fetch(imageUrl);
                const arrayBuffer = await imageResponse.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                base64Data = buffer.toString('base64');
            } catch (fetchError) {
                console.error('Failed to fetch image from URL:', fetchError);
                return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
            }
        } else if (image) {
            base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        } else {
            return NextResponse.json({ error: 'Image or imageUrl is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;

        if (!key) {
            return NextResponse.json({ error: 'API Key is required' }, { status: 401 });
        }

        const client = new GoogleGenAI({ apiKey: key });

        if (characterOnly) {
            // ===== 強化版角色提取（結構化 JSON 輸出）=====
            const characterPrompt = `
You are an expert AI Art Prompt Engineer specializing in character extraction for consistent AI image generation.

Analyze this image and extract a DETAILED character description that can be used to recreate this exact character in different scenes.

**Instructions:**
1. First, identify the SUBJECT TYPE (person, animal, mascot, robot, creature, etc.)
2. Extract ONLY the subject's intrinsic features - NOT the background, lighting, or scene
3. Be extremely specific about distinctive features that maintain character consistency
4. Use professional AI prompt engineering terminology

**Output JSON format:**
{
    "subjectType": "person | animal | mascot | robot | creature | object | vehicle",
    "coreIdentity": "One-sentence summary of who/what this is",
    "appearance": {
        "face": "facial features, expression type, face shape",
        "hair": "style, color, length, texture (if applicable)",
        "eyes": "color, shape, distinctive features",
        "skin": "tone, texture, any markings",
        "bodyType": "build, height impression, posture style",
        "distinguishingMarks": "scars, tattoos, birthmarks, unique features"
    },
    "attire": {
        "mainOutfit": "primary clothing description",
        "accessories": "jewelry, glasses, bags, etc.",
        "colors": "main color palette of outfit",
        "style": "fashion style category"
    },
    "artisticStyle": {
        "renderStyle": "anime, realistic, 3D, cartoon, etc.",
        "artMovement": "specific art style references",
        "colorPalette": "overall color treatment"
    },
    "consistencyTags": ["list", "of", "key", "tags", "for", "recreating", "this", "character"],
    "promptEN": "Complete English prompt optimized for Stable Diffusion / Midjourney",
    "promptZH": "繁體中文版本的角色描述"
}

CRITICAL: Focus on TIMELESS features. Exclude pose, action, camera angle, lighting, and background.
`;

            const response = await client.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: characterPrompt },
                            {
                                inlineData: {
                                    data: base64Data,
                                    mimeType: "image/png",
                                },
                            },
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json"
                }
            });

            const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text || "");

            try {
                const characterData = JSON.parse(text);

                // 建構最佳化的角色 Prompt
                const optimizedPrompt = characterData.promptEN ||
                    [
                        characterData.coreIdentity,
                        characterData.appearance?.hair,
                        characterData.appearance?.eyes,
                        characterData.attire?.mainOutfit,
                        characterData.artisticStyle?.renderStyle,
                        ...(characterData.consistencyTags || [])
                    ].filter(Boolean).join(", ");

                return NextResponse.json({
                    prompt: optimizedPrompt,
                    promptZh: characterData.promptZH || "",
                    structured: characterData,
                    consistencyTags: characterData.consistencyTags || []
                });
            } catch (parseErr) {
                // 如果 JSON 解析失敗，回退到純文字
                console.error("Character extraction parse error:", parseErr);
                return NextResponse.json({ prompt: text.trim() });
            }

        } else {
            // ===== 標準圖片描述模式（中英文雙語）=====
            const promptText = `
As an expert AI Art Prompt Engineer, analyze this image and generate TWO versions of the prompt:

1. **English Prompt**: A detailed, professional prompt optimized for Stable Diffusion/Midjourney
   - Include: Subject, Art Style, Lighting, Color Palette, Composition, Camera Angle
   - Use professional AI art terminology
   - Make it concise but comprehensive

2. **Traditional Chinese Prompt (繁體中文)**: A natural, descriptive version in Traditional Chinese
   - Translate and adapt the English prompt naturally
   - Keep the same level of detail
   - Use proper Traditional Chinese terminology

**Output as JSON:**
{
    "prompt": "English prompt here",
    "promptZh": "繁體中文提示詞"
}

IMPORTANT: Output ONLY valid JSON, no additional text.
`;

            const response = await client.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: promptText },
                            {
                                inlineData: {
                                    data: base64Data,
                                    mimeType: "image/png",
                                },
                            },
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json"
                }
            });

            const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text || "");

            try {
                const result = JSON.parse(text);
                return NextResponse.json({
                    prompt: result.prompt || text.trim(),
                    promptZh: result.promptZh || ""
                });
            } catch (parseErr) {
                console.error("JSON parse error, returning raw text:", parseErr);
                return NextResponse.json({
                    prompt: text.trim(),
                    promptZh: ""
                });
            }
        }

    } catch (error: any) {
        console.error('Describe error:', error);
        return NextResponse.json({ error: error.message || 'Failed to analyze image' }, { status: 500 });
    }
}
