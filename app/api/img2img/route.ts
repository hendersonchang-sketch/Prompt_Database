import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { imageBase64, prompt, strength, style, apiKey } = await request.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'Reference image is required' }, { status: 400 });
        }

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) return NextResponse.json({ error: 'API Key required' }, { status: 401 });

        const client = new GoogleGenAI({ apiKey: key });

        // 根據強度調整提示
        const strengthLevel = strength || 50; // 0-100
        let styleInstruction = '';

        if (style === 'preserve') {
            styleInstruction = 'Maintain the exact same art style, color palette, and composition as the reference image.';
        } else if (style === 'enhance') {
            styleInstruction = 'Keep the subject but enhance quality, add more details and improve lighting.';
        } else if (style === 'transform') {
            styleInstruction = 'Use the reference as inspiration but feel free to interpret it creatively.';
        } else {
            styleInstruction = 'Reference the original image but apply the requested changes.';
        }

        // 建構圖生圖 Prompt
        const img2imgPrompt = `
Image-to-Image Generation Task.

Reference Image: [Provided below]
Edit Strength: ${strengthLevel}% (${strengthLevel < 30 ? 'subtle changes' : strengthLevel < 70 ? 'moderate changes' : 'significant changes'})

Style Mode: ${styleInstruction}

User Request: ${prompt}

Generate a NEW image based on the reference image with the requested modifications.
The output should be a complete, high-quality image.
`;

        console.log("Img2Img Request:", prompt, "Strength:", strengthLevel);

        // 使用圖片生成模型
        const response = await client.models.generateContent({
            model: "gemini-2.0-flash-exp-image-generation",
            contents: [
                { text: img2imgPrompt },
                {
                    inlineData: {
                        data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
                        mimeType: "image/png"
                    }
                }
            ],
            config: {
                responseModalities: ["TEXT", "IMAGE"]
            }
        });

        // 解析回應中的圖片
        const generatedImages: string[] = [];
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data && part.inlineData.mimeType?.startsWith('image/')) {
                const buffer = Buffer.from(part.inlineData.data, 'base64');
                const filename = `img2img-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, buffer);
                generatedImages.push(`/uploads/${filename}`);
            }
        }

        if (generatedImages.length > 0) {
            return NextResponse.json({
                success: true,
                imageUrl: generatedImages[0],
                allImages: generatedImages,
                prompt: prompt,
                strength: strengthLevel
            });
        } else {
            const textResponse = response.text || "";
            console.log("No image returned, text:", textResponse);
            return NextResponse.json({
                error: "Failed to generate image",
                textResponse: textResponse
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Img2Img Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
