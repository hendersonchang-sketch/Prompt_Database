import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageBase64, apiKey } = body;

        if (!imageBase64 || !apiKey) {
            return NextResponse.json({ error: 'Missing image or API key' }, { status: 400 });
        }

        // Initialize Gemini Client
        const client = new GoogleGenAI({ apiKey });

        const prompt = "Upscale this image to high resolution, 4k, architectural photography, hyper realistic, sharp focus, detailed texture. Maintain the exact same composition and subject.";

        // Attempting to use gemini-2.5-flash-image for "Upscaling" via Img2Img
        // We cannot truly "Set Resolution" in the public API easily beyond aspect ratio, 
        // but passing a high-fidelity prompt usually results in a clean redraw.
        // Ideally we would use a specialized Upscale model if available.

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                                mimeType: 'image/png'
                            }
                        }
                    ]
                }
            ],
            config: {
                responseModalities: ['IMAGE'],
                // forcing a "wide" high res aspect ratio might help, but sticking to original is safer for now.
                // We rely on the model's ability to output cleaner pixels.
            }
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.inlineData?.data) {
            const resultBase64 = candidate.content.parts[0].inlineData.data;
            return NextResponse.json({
                imageBase64: resultBase64,
                mimeType: 'image/jpeg'
            });
        }

        throw new Error("No image generated");

    } catch (error: any) {
        console.error("Upscale failed:", error);
        return NextResponse.json({ error: error.message || 'Upscale failed' }, { status: 500 });
    }
}
