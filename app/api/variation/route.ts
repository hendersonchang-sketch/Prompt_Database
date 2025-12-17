import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    try {
        const { prompt, variationType, apiKey, customInstruction } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Original prompt is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        let instruction = "";

        switch (variationType) {
            case "scene":
                instruction = `Keep the same subject/character but place them in a completely different scene/environment. 
                For example: if the original is "a cat on a sofa", create "a cat in a garden" or "a cat on a rooftop at night".`;
                break;
            case "angle":
                instruction = `Keep the same subject and scene but change the camera angle/perspective.
                Options: close-up, wide shot, bird's eye view, low angle, side view, back view, etc.`;
                break;
            case "style":
                instruction = `Keep the same subject and composition but change the art style.
                Options: anime, oil painting, watercolor, cyberpunk, vintage photo, 3D render, pixel art, etc.`;
                break;
            case "time":
                instruction = `Keep the same subject and scene but change the time of day or weather.
                Options: sunrise, sunset, night, rainy, snowy, foggy, golden hour, etc.`;
                break;
            case "series":
                instruction = `Create the next image in a story sequence. What happens next?
                Maintain continuity with the subject but advance the action or narrative.`;
                break;
            case "mood":
                instruction = `Keep the same subject but change the emotional mood/atmosphere.
                Options: happy, sad, angry, peaceful, mysterious, romantic, scary, energetic, melancholic.`;
                break;
            case "color":
                instruction = `Keep the same composition but change the color palette dramatically.
                Options: warm tones (orange/red), cool tones (blue/purple), monochrome, pastel, neon, sepia, high contrast.`;
                break;
            case "season":
                instruction = `Keep the same subject and scene but change the season.
                Options: spring (cherry blossoms, fresh green), summer (bright sun, beach), autumn (orange leaves, harvest), winter (snow, cozy).`;
                break;
            case "distance":
                instruction = `Keep the same subject but dramatically change the camera distance.
                Options: extreme close-up (face/detail only), close-up, medium shot, full body, wide shot, aerial view, macro.`;
                break;
            case "mirror":
                instruction = `Flip or mirror the composition creatively.
                Options: view from behind, reflection in mirror/water, view from below looking up, reverse perspective.`;
                break;
            case "custom":
                instruction = customInstruction || "Create a creative variation.";
                break;
            default:
                instruction = `Create a creative variation while keeping the core subject similar.`;
        }

        const variationPrompt = `
You are an expert AI Art Prompt Engineer. Given an original image prompt, create a variation based on the instruction.

Original prompt: "${prompt}"

Variation instruction: ${instruction}

Rules:
- Output ONLY the new prompt, nothing else
- Keep it under 100 words
- Maintain quality keywords (8K, detailed, etc.)
- Do not add NSFW content
- Do not include explanatory text
- IMPORTANT: If the scene is indoors (cafe, room, studio, interior, etc.) and involves winter/snow, 
  make sure snow is ONLY visible through windows. Add "no snow inside, clear indoor air" explicitly.

New variation prompt:`;

        const result = await model.generateContent(variationPrompt);
        const response = await result.response;
        let variation = response.text().trim();

        // Post-processing: Fix indoor snow issue
        const indoorKeywords = ['cafe', 'room', 'interior', 'inside', 'indoor', 'studio', 'kitchen', 'living room', 'bedroom', 'office', 'restaurant', 'bar', 'shop', 'store'];
        const winterKeywords = ['snow', 'winter', 'snowy', 'snowing'];

        const isIndoor = indoorKeywords.some(kw => variation.toLowerCase().includes(kw));
        const hasWinter = winterKeywords.some(kw => variation.toLowerCase().includes(kw));

        if (isIndoor && hasWinter) {
            // Add protection if not already present
            if (!variation.toLowerCase().includes('no snow inside') && !variation.toLowerCase().includes('through window')) {
                variation = variation.replace(/\.$/, '') + ', snow visible only through windows, no snow falling inside, clear indoor air.';
            }
        }

        return NextResponse.json({
            original: prompt,
            variation: variation,
            type: variationType
        });

    } catch (error: any) {
        console.error("Variation error:", error);
        return NextResponse.json(
            { error: error.message || "Variation generation failed" },
            { status: 500 }
        );
    }
}
