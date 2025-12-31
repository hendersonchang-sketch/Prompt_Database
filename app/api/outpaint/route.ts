import { NextResponse } from 'next/server';
// @ts-ignore
import sharp from 'sharp';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageBase64, apiKey, prompt, ratio = "16:9" } = body;

        if (!imageBase64 || !apiKey) {
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
        }

        // 1. Prepare the Canvas using Sharp
        const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const metadata = await sharp(buffer).metadata();

        let newWidth = metadata.width!;
        let newHeight = metadata.height!;

        // Calculate new dimensions based on ratio (assuming horizontal expansion for 16:9)
        if (ratio === "16:9") {
            newWidth = Math.round(newHeight * (16 / 9));
        } else if (ratio === "9:16") {
            newHeight = Math.round(newWidth * (16 / 9));
        } else {
            // Default to 2x width expansion if unspecified
            newWidth = metadata.width! * 1.5;
        }

        // Check limits
        if (newWidth > 3000 || newHeight > 3000) {
            // Cap at reasonable size to avoid timeouts
            // Scale down if necessary? For now just try.
        }

        // Create new canvas with transparent background
        // Place original image in CENTER 
        const expandedBuffer = await sharp({
            create: {
                width: Math.round(newWidth),
                height: Math.round(newHeight),
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .composite([
                { input: buffer, gravity: 'center' }
            ])
            .png()
            .toBuffer();

        const expandedBase64 = expandedBuffer.toString('base64');

        // 2. Call Gemini for Inpainting/Editing
        // Note: As of late 2024, gemini-2.5-flash-image might not support explicit "mask" via public API easily.
        // We will try using Img2Img with a strong instruction to "Fill the transparent areas".
        // If Model doesn't support Alpha channel well, this might fail (it might turn transparency black).
        // A better approach if mask API is not available: use a white background and ask it to "Extend the image".

        const client = new GoogleGenAI({ apiKey });

        const editPrompt = `Outpainting Task: The provided image has empty space (transparency) around the central subject. 
        Your task is to FILL the empty space with seamless content that matches the original style, lighting, and context.
        Do NOT change the central original content. 
        Original Prompt Context: ${prompt || "A beautiful scene"}`;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-image', // or 'imagen-3.0-generate-001' if available for edit
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: editPrompt },
                        {
                            inlineData: {
                                data: expandedBase64,
                                mimeType: 'image/png'
                            }
                        }
                    ]
                }
            ],
            config: {
                responseModalities: ['IMAGE'],
            }
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.inlineData?.data) {
            const resultBase64 = candidate.content.parts[0].inlineData.data;
            return NextResponse.json({
                imageBase64: resultBase64,
                mimeType: 'image/png' // Gemini usually returns png for images
            });
        }

        throw new Error("Outpainting generation failed");

    } catch (error: any) {
        console.error("Outpaint failed:", error);
        return NextResponse.json({ error: error.message || 'Outpaint failed' }, { status: 500 });
    }
}
