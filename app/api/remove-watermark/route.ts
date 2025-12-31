import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

export async function POST(request: Request) {
    try {
        const { imageBase64, mimeType, apiKey } = await request.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        // 1. 準備原始高畫質圖片 Buffer 做為最終底圖
        const originalInputBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const inputBuffer = Buffer.from(originalInputBase64, 'base64');
        const metadata = await sharp(inputBuffer).metadata();

        if (!metadata.width || !metadata.height) {
            throw new Error("無法讀取圖片尺寸");
        }

        const client = new GoogleGenAI({ apiKey: key });

        // 2. Step 1: 將全圖發送給 Gemini，使其能感知背景上下文
        // 使用 client.models.generateContent 以確保呼叫成功
        const response = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                {
                    inlineData: {
                        data: originalInputBase64,
                        mimeType: mimeType || 'image/png'
                    }
                },
                { text: "Locate and remove the small logo or watermark in the bottom-right corner. Naturally restore that corner based on the surrounding background, lighting, and context of the whole image. Output the edited image." }
            ],
            config: {
                responseModalities: ["IMAGE", "TEXT"],
            }
        });

        // 3. Step 2: 從 AI 的全圖輸出中擷取「修復後的角落」並合併回「原始圖」
        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const aiResultBase64 = part.inlineData.data;
                    const aiResultBuffer = Buffer.from(aiResultBase64, 'base64');

                    // 計算要擷取的角落範圍 (右下角 25% 寬, 20% 高)
                    const cropWidth = Math.floor(metadata.width * 0.25);
                    const cropHeight = Math.floor(metadata.height * 0.20);
                    const cropLeft = metadata.width - cropWidth;
                    const cropTop = metadata.height - cropHeight;

                    // A. 先將 AI 輸出縮放回與原圖一致的尺寸 (預防 AI 改變了解析度)
                    const resizedAiBuffer = await sharp(aiResultBuffer)
                        .resize(metadata.width, metadata.height, { fit: 'fill' })
                        .toBuffer();

                    // B. 從縮放後的 AI 圖中擷取修補好的角落
                    const repairedCorner = await sharp(resizedAiBuffer)
                        .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
                        .toBuffer();

                    // C. 將這個「已修復角落」貼回「原始圖片」
                    // 這一步保證了圖片的其他 80% 區域維持 Byte-level 的原封不動 (無 Subject Change)
                    const finalBuffer = await sharp(inputBuffer)
                        .composite([{
                            input: repairedCorner,
                            left: cropLeft,
                            top: cropTop
                        }])
                        .toFormat('jpeg', { quality: 100, chromaSubsampling: '4:4:4' }) // 極致畫質輸出
                        .toBuffer();

                    return NextResponse.json({
                        success: true,
                        imageBase64: finalBuffer.toString('base64'),
                        mimeType: 'image/jpeg'
                    });
                }
            }
        }

        return NextResponse.json({
            error: 'Watermark removal failed to generate image',
            note: 'AI response did not contain image data'
        }, { status: 400 });

    } catch (error: any) {
        console.error("Watermark removal error:", error);
        return NextResponse.json(
            { error: error.message || "Watermark removal failed" },
            { status: 500 }
        );
    }
}
