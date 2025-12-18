import { NextResponse } from "next/server";
import { generateImage, InlineImageData } from "@/services/geminiImageService";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt, engineType, images = [], thinkingLevel } = body;

        // 1. 驗證必要參數
        if (!prompt) {
            return NextResponse.json(
                { success: false, error: "Prompt is required" },
                { status: 400 }
            );
        }

        if (!engineType || !["flash", "pro", "imagen"].includes(engineType)) {
            return NextResponse.json(
                { success: false, error: "Invalid or missing engineType" },
                { status: 400 }
            );
        }

        // 2. 獲取 API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: "GEMINI_API_KEY is not configured in environment" },
                { status: 500 }
            );
        }

        // 3. 處理圖片資料 (Base64 陣列轉為 InlineImageData)
        const formattedImages: InlineImageData[] = images.map((base64: string) => {
            // 嘗試從 Data URL 中提取 MimeType，預設為 image/png
            const mimeTypeMatch = base64.match(/^data:(image\/\w+);base64,/);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";
            const data = base64.replace(/^data:image\/\w+;base64,/, "");

            return {
                data,
                mimeType,
            };
        });

        // 4. 呼叫 Service 生成圖片
        const result = await generateImage({
            prompt,
            engineType,
            images: formattedImages,
            apiKey,
            thinkingLevel,
        });

        // 5. 回傳結果
        if (result.success) {
            return NextResponse.json({
                success: true,
                imageBase64: result.imageBase64,
                model: result.model,
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("[POST /api/generate] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
