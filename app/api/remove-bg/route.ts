import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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

        const client = new GoogleGenAI({ apiKey: key });

        // Use imagen model for image editing
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType || 'image/png'
            }
        };

        const response = await client.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [
                imagePart,
                { text: "Remove the background from this image completely. Make the background transparent or pure white. Keep only the main subject in the foreground. Output the edited image." }
            ],
            config: {
                responseModalities: ["IMAGE", "TEXT"],
            }
        });

        // Check if there's an image in the response
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const imageData = part.inlineData.data;
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
