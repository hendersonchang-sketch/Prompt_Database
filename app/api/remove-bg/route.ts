import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

        const genAI = new GoogleGenerativeAI(key);

        // Use imagen model for image editing
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                // @ts-ignore - experimental feature
                responseModalities: ["image", "text"],
            }
        });

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType || 'image/png'
            }
        };

        const result = await model.generateContent([
            imagePart,
            "Remove the background from this image completely. Make the background transparent or pure white. Keep only the main subject in the foreground. Output the edited image."
        ]);

        const response = await result.response;

        // Check if there's an image in the response
        const candidates = response.candidates;
        if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
            for (const part of candidates[0].content.parts) {
                // @ts-ignore
                if (part.inlineData) {
                    // @ts-ignore
                    const imageData = part.inlineData.data;
                    // @ts-ignore
                    const imageMimeType = part.inlineData.mimeType || 'image/png';

                    return NextResponse.json({
                        success: true,
                        imageBase64: imageData,
                        mimeType: imageMimeType
                    });
                }
            }
        }

        return NextResponse.json({
            error: 'Background removal not supported for this image',
            note: 'Gemini may not support image editing for all images'
        }, { status: 400 });

    } catch (error: any) {
        console.error("Background removal error:", error);
        return NextResponse.json(
            { error: error.message || "Background removal failed" },
            { status: 500 }
        );
    }
}
