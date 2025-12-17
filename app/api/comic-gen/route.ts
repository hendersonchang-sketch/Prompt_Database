import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { story, style, apiKey } = body;

        if (!story || !apiKey) {
            return NextResponse.json({ error: "Story and API Key are required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Step 1: Scripting with Gemini 2.0 Flash
        // Using stable flash model for scripting
        const scriptModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const scriptPrompt = `
        You are a professional comic book writer and director.
        Task: Break down the following story into exactly 4 distinct comic strip panels.
        Target Style: ${style || "General Comic"}

        Story: "${story}"

        CRITICAL: To ensure consistency, first define the Main Character's visual appearance in detail.

        Output Requirement:
        Return ONLY a JSON object with this structure:
        {
            "mainCharacterVisuals": "A detailed visual description of the main character (e.g. A young girl with blue hair wearing a red space suit)...",
            "panels": [
                { "panelNumber": 1, "description": "Visual description of the scene...", "caption": "Short caption..." },
                { "panelNumber": 2, "description": "Visual description...", "caption": "..." },
                { "panelNumber": 3, "description": "Visual description...", "caption": "..." },
                { "panelNumber": 4, "description": "Visual description...", "caption": "..." }
            ]
        }
        `;

        const scriptResult = await scriptModel.generateContent({
            contents: [{ role: "user", parts: [{ text: scriptPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const scriptData = JSON.parse(scriptResult.response.text());
        const panels = scriptData.panels;
        const charDesc = scriptData.mainCharacterVisuals || "";

        if (!panels || panels.length !== 4) {
            throw new Error("Failed to generate valid 4-panel script");
        }

        // Step 2: Parallel Image Generation
        // Using Gemini 2.0 Flash Image Generation

        const imageGenModel = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp-image-generation",
            // @ts-ignore
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
        });

        const generatedPanels = await Promise.all(panels.map(async (panel: any) => {
            try {
                // Construct a rich prompt with CHARACTER ANCHORING
                // We prepend the character description to every panel prompt
                const fullPrompt = `Comic strip panel, ${style} style.
                Character: ${charDesc}.
                Scene: ${panel.description}.
                High quality, consistent character, detailed background, distinct comic book lines.`;

                const result = await imageGenModel.generateContent(fullPrompt);
                const response = result.response;

                // Extract Image
                // Note: In a real app we'd save to disk. Here we'll do inline base64 or save.
                // Let's save to disk to be consistent with other routes.
                const fs = require('fs');
                const path = require('path');
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

                let imageUrl = "";

                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
                        const buffer = Buffer.from(part.inlineData.data, 'base64');
                        const filename = `comic-${Date.now()}-${panel.panelNumber}-${Math.random().toString(36).substring(7)}.png`;
                        const filepath = path.join(uploadDir, filename);
                        fs.writeFileSync(filepath, buffer);
                        imageUrl = `/uploads/${filename}`;
                        break;
                    }
                }

                return {
                    ...panel,
                    imageUrl: imageUrl,
                    prompt: fullPrompt // Return the used prompt for reference/saving
                };
            } catch (err) {
                console.error(`Error generating panel ${panel.panelNumber}:`, err);
                return {
                    ...panel,
                    imageUrl: null,
                    error: "Generation failed"
                };
            }
        }));

        return NextResponse.json({ panels: generatedPanels, characterConfig: charDesc });

    } catch (error: any) {
        console.error("Comic Gen Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Save Comic Strip Panels to Database
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { panels, tags } = body; // panels array of { imageUrl, prompt, caption }

        if (!panels || !Array.isArray(panels)) {
            return NextResponse.json({ error: "Invalid panels data" }, { status: 400 });
        }

        const savedEntries = [];

        for (const panel of panels) {
            if (!panel.imageUrl) continue;

            const entry = await prisma.promptEntry.create({
                data: {
                    prompt: panel.prompt || panel.description,
                    originalPrompt: panel.caption || "Comic Panel",
                    promptZh: panel.caption || "", // Store caption in zh field for display
                    tags: tags || "comic, story",
                    imageUrl: panel.imageUrl,
                    width: 1024,
                    height: 1024,
                    sampler: "Gemini",
                    seed: 0,
                    cfgScale: 7.0,
                    steps: 25,
                }
            });
            savedEntries.push(entry);
        }

        return NextResponse.json({ success: true, count: savedEntries.length });

    } catch (error: any) {
        console.error("Save Comic Error:", error);
        return NextResponse.json({ error: "Failed to save comic" }, { status: 500 });
    }
}
