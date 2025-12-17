import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    try {
        const { image, apiKey, characterOnly = false } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        // Use provided API key or fallback to env var (though frontend usually passes it if custom)
        // For security, usually env is better, but this app seems to allow user-provided keys.
        // We'll prioritize the passed key if it exists, else env.
        const key = apiKey || process.env.GEMINI_API_KEY;

        if (!key) {
            return NextResponse.json({ error: 'API Key is required' }, { status: 401 });
        }

        const genAI = new GoogleGenerativeAI(key);
        // Use Gemini 2.0 Flash Experimental for vision capabilities  
        const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash-exp" });

        // Remove header if present (data:image/png;base64,)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        // Different prompts based on mode
        const prompt = characterOnly
            ? `
            As an expert AI Art Prompt Engineer, analyze this image and extract ONLY the MAIN SUBJECT description.
            
            First, identify what type of subject this is:
            - Person/Character → describe ethnicity/skin tone, appearance, hair, eyes, clothing, art style
            - Animal/Creature → describe species, colors, markings, fur/feathers, size
            - Product/Object → describe shape, materials, colors, textures, brand elements
            - Mascot/Character Design → describe design elements, colors, expressions, accessories
            - Vehicle → describe type, color, style, distinctive features
            - Architecture → describe style, materials, key features
            
            Focus ONLY on the subject's inherent characteristics.
            
            DO NOT include:
            - Background or environment
            - Lighting or atmosphere  
            - Camera angle or composition
            - Actions or poses (describe neutral state)
            
            Output ONLY a concise English description of the subject, ready to be combined with different scenes.
            Example formats:
            - Person: "A young woman with long silver twin-tail hair, bright blue eyes, wearing a black gothic lolita dress, anime style"
            - Animal: "A fluffy orange tabby cat with green eyes, white paws, cute round face, realistic style"
            - Product: "A sleek matte black wireless headphone with rose gold accents, over-ear design, premium materials"
            - Mascot: "A cheerful blue blob mascot with large googly eyes, small arms, wearing a red bow tie, cartoon style"
            `
            : `
            As an expert AI Art Prompt Engineer, describe this image in detail.
            Focus on:
            1. Subject (appearance, pose, clothing)
            2. Art Style (e.g., oil painting, cyberpunk, photorealistic, 3D render)
            3. Lighting & Color Palette
            4. Composition & Camera Angle

            Output ONLY the raw English prompt string, ready to be pasted into Stable Diffusion or Midjourney. 
            Do not add introductory text like "Here is the prompt:".
            `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png", // Generic mime type usually works, or extract from input
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ prompt: text.trim() });

    } catch (error: any) {
        console.error('Describe error:', error);
        return NextResponse.json({ error: error.message || 'Failed to analyze image' }, { status: 500 });
    }
}
