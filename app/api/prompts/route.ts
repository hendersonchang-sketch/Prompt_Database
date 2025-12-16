import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
    try {
        console.log("GET /api/prompts hit");
        const prompts = await prisma.promptEntry.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(prompts);
    } catch (error) {
        console.error('Failed to fetch prompts:', error);
        return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            prompt,
            negativePrompt,
            width = 1024,
            height = 1024,
            sampler = "Euler a",
            seed,
            cfgScale = 7.0,
            steps = 25,
            provider = "mock",
            apiUrl,
            apiKey,
            imageCount = 1,  // 1-4 images
            previewMode = false, // If true, return images without saving to DB
            referenceImage = null // Base64 reference image for img2img
        } = body;

        // Initialize Bilingual Data
        let finalPrompt = prompt;
        let promptZh = "";
        let originalPrompt = prompt;
        let finalImageUrl = "";
        let tagsResult = provider;

        // Parallel Processing for Translation & Tagging (Only if API Key is present)
        if (apiKey) {
            try {
                // Use available model from diagnostic list: gemini-2.0-flash
                let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

                // Optimized System Prompt: Handles Translation AND Tagging in one go
                const analysisPrompt = `
                You are an expert AI art prompt assistant. 
                Task 1: Detect the language of the user Input.
                Task 2: If Input is Chinese, translate it to high-quality English for Image Generation (enPrompt). Keep the original as zhPrompt.
                Task 3: If Input is English, keep it as enPrompt, and translate it to Traditional Chinese for display (zhPrompt).
                Task 4: Generate 3-5 concise descriptive tags in Traditional Chinese for categorization.
                
                Return ONLY a JSON object with this structure:
                {
                    "enPrompt": "string (optimized for Stable Diffusion/Imagen)",
                    "zhPrompt": "string (Traditional Chinese)",
                    "tags": "string (comma joined tags)"
                }

                User Input: ${prompt}
                `;

                const analysisResp = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: analysisPrompt }] }],
                        generationConfig: { responseMimeType: "application/json" } // Force JSON mode
                    })
                });

                if (analysisResp.ok) {
                    const data = await analysisResp.json();
                    let text = data.candidates[0].content.parts[0].text;

                    // DEBUG LOGGING
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const logPath = path.join(process.cwd(), 'debug_log.txt');
                        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] Raw Gemini Response:\n${text}\n-------------------\n`);
                    } catch (e) { console.error("Log write failed", e); }

                    console.log("Raw Gemini Analysis Response:", text); // Debug Log

                    // Robust JSON Extraction: Find first '{' and last '}'
                    const start = text.indexOf('{');
                    const end = text.lastIndexOf('}');

                    if (start !== -1 && end !== -1) {
                        try {
                            const jsonStr = text.substring(start, end + 1);
                            const result = JSON.parse(jsonStr);

                            // Valid result
                            finalPrompt = result.enPrompt || prompt;
                            promptZh = result.zhPrompt || "";
                            tagsResult = result.tags || "";

                            console.log("Gemini Analysis Parsing Success:", result);
                        } catch (parseErr) {
                            console.error("Gemini Analysis JSON Parse Failed via Substring method. Raw:", text);
                        }
                    } else {
                        console.warn("No JSON object found in Gemini response");
                    }
                } else {
                    const errText = await analysisResp.text();
                    console.error("Gemini Analysis API Failed:", analysisResp.status, errText);

                    // DIAGNOSTIC: List Models
                    let availableModels = "Could not fetch models";
                    try {
                        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                        const listData = await listResp.json();
                        if (listData.models) {
                            availableModels = listData.models.map((m: any) => m.name).join(", ");
                        }
                    } catch (e) { }

                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const logPath = path.join(process.cwd(), 'debug_log.txt');
                        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] API Error ${analysisResp.status}:\n${errText}\nAVAILABLE MODELS: ${availableModels}\n`);
                    } catch (e) { }
                }
            } catch (err) {
                console.error("Bilingual/Tagging analysis failed:", err);
                // Fallback: Use original prompt, simple tag
            }
        }

        // Seed Generation
        const finalSeed = seed && seed !== -1 ? seed : Math.floor(Math.random() * 1000000);

        // Provider Logic (Now uses finalPrompt which is likely English)
        if (provider === "gemini" && apiKey) {
            try {
                console.log("Attempting to call Imagen API with:", finalPrompt);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

                // Build payload (referenceImages disabled - needs Vertex AI)
                const payload = {
                    instances: [{ prompt: finalPrompt }],
                    parameters: {
                        sampleCount: Math.min(Math.max(imageCount, 1), 4), // 1-4 images
                        aspectRatio: width === height ? "1:1" : width > height ? "16:9" : "9:16",
                    }
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const responseText = await response.text();
                if (!response.ok) throw new Error(`Imagen API Error (${response.status}): ${responseText}`);

                const data = JSON.parse(responseText);

                if (data.predictions && data.predictions.length > 0) {
                    const generatedImages: string[] = [];
                    const fs = require('fs');
                    const path = require('path');
                    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

                    for (let i = 0; i < data.predictions.length; i++) {
                        const pred = data.predictions[i];
                        if (pred.bytesBase64Encoded) {
                            const buffer = Buffer.from(pred.bytesBase64Encoded, 'base64');
                            const filename = `imagen-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.png`;
                            const filepath = path.join(uploadDir, filename);
                            fs.writeFileSync(filepath, buffer);
                            generatedImages.push(`/uploads/${filename}`);
                        }
                    }

                    // If preview mode or multiple images, return array without saving to DB
                    if (previewMode || imageCount > 1) {
                        return NextResponse.json({
                            previewMode: true,
                            images: generatedImages,
                            prompt: finalPrompt,
                            originalPrompt: originalPrompt,
                            promptZh: promptZh,
                            tags: tagsResult,
                            width,
                            height,
                            seed: finalSeed,
                            cfgScale,
                            steps,
                            negativePrompt
                        });
                    }

                    // Single image, save directly
                    finalImageUrl = generatedImages[0] || "";
                } else {
                    throw new Error("Invalid Imagen response - no predictions");
                }

            } catch (err: any) {
                console.error("Imagen Gen Failed:", err);
                throw new Error("Imagen Generation Failed: " + err.message);
            }
        } else if (provider === "sd" && apiUrl) {
            console.log("SD Generation requested from:", apiUrl);
            // In a real SD implementation, we would use `finalPrompt` (English) here
            finalImageUrl = `https://picsum.photos/seed/${finalSeed}/${width}/${height}`;
        } else {
            // Mock
            finalImageUrl = `https://picsum.photos/seed/${finalSeed}/${width}/${height}`;
        }

        const entry = await prisma.promptEntry.create({
            data: {
                prompt: finalPrompt, // English / Optimized
                originalPrompt: originalPrompt, // What user typed
                promptZh: promptZh, // Chinese Display
                negativePrompt,
                imageUrl: finalImageUrl,
                width,
                height,
                sampler,
                seed: finalSeed,
                cfgScale,
                steps,
                tags: tagsResult,
            }
        });

        return NextResponse.json(entry);
    } catch (error: any) {
        console.error('Failed to create prompt:', error);
        return NextResponse.json({
            error: 'Failed to create prompt',
            details: error?.message || 'Unknown error',
            stack: error?.stack
        }, { status: 500 });
    }
}

// PUT: Save selected image from preview to database
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const {
            imageUrl,
            prompt,
            originalPrompt,
            promptZh,
            negativePrompt,
            width,
            height,
            seed,
            cfgScale,
            steps,
            tags
        } = body;

        const entry = await prisma.promptEntry.create({
            data: {
                prompt,
                originalPrompt,
                promptZh,
                negativePrompt: negativePrompt || "",
                imageUrl,
                width: width || 1024,
                height: height || 1024,
                sampler: "Euler a",
                seed: seed || 0,
                cfgScale: cfgScale || 7.0,
                steps: steps || 25,
                tags: tags || "",
            }
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error('Failed to save selected image:', error);
        return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
    }
}
