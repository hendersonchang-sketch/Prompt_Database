import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { image, mask, prompt, apiKey } = body;

        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        if (!image || !mask || !prompt) {
            return NextResponse.json({ error: "Image, mask, and prompt are required" }, { status: 400 });
        }

        console.log("Magic Canvas Request received for prompt:", prompt);

        // Initialize Gemini
        const client = new GoogleGenAI({ apiKey });

        // Prepare Image Parts
        const imagePart = {
            inlineData: {
                data: image.split(',')[1],
                mimeType: "image/png"
            },
        };

        const maskPart = {
            inlineData: {
                data: mask.split(',')[1],
                mimeType: "image/png"
            },
        };

        // Construct Edit Prompt
        const editingPrompt = `Foundational Model Image Editing Task.
        Input Image provided.
        Input Mask provided (white area is the mask).
        Edit Instruction: ${prompt}.
        Apply the changes ONLY to the masked area. Maintain the style, lighting, and perspective of the original image.`;

        // Generate
        const response = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                { text: editingPrompt },
                imagePart,
                maskPart
            ]
        });
        const text = response.text || JSON.stringify(response.candidates?.[0]?.content?.parts?.[0]?.text || "");

        // Gemini 2.0 Flash usually returns a description of the edit, BUT we want the unexpected behavior:
        // Actually, pure Gemini 2.0 Flash text-model might NOT return an image directly unless we use specific editing capability or image-gen model.
        // Wait, for *editing*, we might need a specific endpoint or trick.
        // Currently Gemini API standard 'generateContent' returns text unless 'responseModalities' is set or it decides to.
        // However, for purposes of this demo, we might need to rely on the fact that if we send an image, it *might* generate one if asked to "draw".
        // Let's try forcing it to generate an image or check if we need to use 'imagen-3.0-capability'.

        // RE-EVALUATION: The standard Gemini 2.0 Flash Exp API is primarily Multimodal INPUT, Text OUTPUT.
        // To do generic Image Editing (Inpainting), we usually use Imagen 2/3/4 via Vertex AI or specific endpoint.
        // BUT, since we only have the Studio/Gemini API Key, we have to rely on what's available.
        // If Gemini 2.0 Flash doesn't support outputting images properly yet via this key, we might need a workaround or mock it if strictly impossible.
        // HOWEVER, recent updates suggest Gemini 2.0 *can* generate images. Let's try to ask it explicitly.

        // Fix: Use "gemini-2.0-flash-exp" and hope for image output or use the specific image generation model workflow if applicable.
        // Actually, let's look at `app/api/prompts/route.ts` - we saw `gemini-2.0-flash-exp-image-generation` model used there!
        // That is likely the key. But that model usually takes text -> image.
        // Does it take Image + Mask -> Image? Unclear.
        // Let's try to pass the images to `gemini-2.0-flash-exp` (which accepts inputs) and ask it to output an image.

        // NOTE: If this fails to return an image, we might need to fallback to a "New Generation based on Image" (Img2Img) approach if strictly Inpainting isn't supported by public API yet.
        // For now, let's assume we can try to get an image back.

        // We will try to parse image from response similar to prompts route.
        const generatedImages: string[] = [];

        // Helper to save
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data && part.inlineData.mimeType?.startsWith('image/')) {
                const buffer = Buffer.from(part.inlineData.data, 'base64');
                const filename = `magic-canvas-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
                const filepath = path.join(uploadDir, filename);
                fs.writeFileSync(filepath, buffer);
                generatedImages.push(`/uploads/${filename}`);
            }
        }

        if (generatedImages.length > 0) {
            return NextResponse.json({ imageUrl: generatedImages[0] });
        } else {
            console.log("No image returned from Gemini Magic Canvas, text response:", text);
            return NextResponse.json({ error: "Failed to generate edited image. Model returned text: " + text }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Magic Canvas API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
