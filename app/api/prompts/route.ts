import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from "@google/genai";

// Helper to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const semantic = searchParams.get('semantic') === 'true';
        const apiKey = request.headers.get('x-api-key') || searchParams.get('apiKey');

        // Paging Parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        console.log(`GET /api/prompts hit. Search: ${search}, Semantic: ${semantic}, Page: ${page}, Limit: ${limit}`);

        // Field selection to reduce data size (exclude heavy embedding)
        const selectFields = {
            id: true,
            prompt: true,
            negativePrompt: true,
            imageUrl: true,
            width: true,
            height: true,
            sampler: true,
            seed: true,
            cfgScale: true,
            steps: true,
            tags: true,
            promptZh: true,
            originalPrompt: true,
            isFavorite: true,
            createdAt: true,
            // embedding: false // Excluded
        };

        // 1. Semantic Search (Semantic search usually requires all or a large set of embeddings, but we'll still slice/paginate the results)
        if (semantic && search && apiKey) {
            console.log("Performing Semantic Search...");
            // Get query embedding
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
            const embedResponse = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "models/text-embedding-004",
                    content: { parts: [{ text: search }] }
                })
            });

            if (!embedResponse.ok) {
                console.error("Embedding API Failed", await embedResponse.text());
                throw new Error("Failed to embed query");
            }

            const embedData = await embedResponse.json();
            const queryVector = embedData.embedding?.values;

            if (!queryVector) throw new Error("No embedding returned");

            // Fetch prompts with embeddings for matching
            // @ts-ignore
            const allWithEmbeds = await prisma.promptEntry.findMany({
                select: { ...selectFields, embedding: true }
            });

            const scoredPrompts = allWithEmbeds
                .filter((p: any) => p.embedding)
                .map((p: any) => {
                    try {
                        const vec = JSON.parse(p.embedding);
                        return { ...p, score: cosineSimilarity(queryVector, vec) };
                    } catch (e) {
                        return { ...p, score: -1 };
                    }
                })
                .filter((p: any) => p.score > 0.3)
                .sort((a: any, b: any) => b.score - a.score);

            // Manual pagination for semantic results
            const paginatedResults = scoredPrompts.slice(skip, skip + limit).map(({ embedding, ...rest }: any) => rest);
            const total = scoredPrompts.length;
            return NextResponse.json({
                prompts: paginatedResults,
                pagination: {
                    page,
                    limit,
                    total,
                    hasMore: skip + paginatedResults.length < total
                }
            });
        }

        // 2. Keyword Search
        else if (search) {
            const where = {
                OR: [
                    { prompt: { contains: search } },
                    { promptZh: { contains: search } },
                    { tags: { contains: search } },
                    { originalPrompt: { contains: search } }
                ]
            };
            // @ts-ignore
            const prompts = await prisma.promptEntry.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: limit,
                select: selectFields
            });
            // @ts-ignore
            const total = await prisma.promptEntry.count({ where });
            return NextResponse.json({
                prompts,
                pagination: {
                    page,
                    limit,
                    total,
                    hasMore: skip + prompts.length < total
                }
            });
        }

        // 3. Default List
        else {
            // @ts-ignore
            const prompts = await prisma.promptEntry.findMany({
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: limit,
                select: selectFields
            });
            // @ts-ignore
            const total = await prisma.promptEntry.count();
            return NextResponse.json({
                prompts,
                pagination: {
                    page,
                    limit,
                    total,
                    hasMore: skip + prompts.length < total
                }
            });
        }
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
            imageBase64 = null, // Optional for img2img
            strength = 50,
            style = "preserve",
            useSearch = false // NEW: Trigger for Google Search Retrieval
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

                // Dynamic Tool Configuration
                const tools = useSearch ? [{ google_search_retrieval: {} }] : [];

                // Calculate Season/Time of Day for Visual Context
                const now = new Date();
                const month = now.getMonth(); // 0-11
                const hour = now.getHours();

                let season = "Unknown";
                if (month >= 2 && month <= 4) season = "Spring";
                else if (month >= 5 && month <= 7) season = "Summer";
                else if (month >= 8 && month <= 10) season = "Autumn";
                else season = "Winter";

                let timeOfDay = "Day";
                if (hour >= 18 || hour <= 5) timeOfDay = "Night";
                else if (hour >= 16) timeOfDay = "Golden Hour/Sunset";
                else if (hour <= 8) timeOfDay = "Morning";

                // Professional Visual Prompt Engineer System Instruction
                const analysisPrompt = `
**Role & Objective:**
You are an expert "Visual Prompt Engineer" for an AI Image Generator (Imagen 4.0).
Your goal is to transform the user's raw input into a single, highly detailed, photorealistic ENGLISH prompt.

**CRITICAL: GLOBAL LIVE CONTEXT**
The current real-world state is:
- **Date:** ${now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
- **Date (ISO):** ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}
- **Time:** ${now.toLocaleTimeString('zh-TW')}
- **Calculated Season:** ${season}
- **Approx. Lighting:** ${timeOfDay}

**MANDATORY INSTRUCTION ON TIME/DATE & TEXT:**
If the user's prompt implies "Current", "Latest", "Now", "Today", or "Live" status:
1.  **VISUALS:** You MUST visually represent the ${season} season and ${timeOfDay} lighting (e.g., if Winter, show snow/cold atmosphere).
2.  **TEXT/DATA:** If the user implies a "Display", "Screen", "Label", or "Text" showing the date:
    - **YOU MUST** write the prompt to include: "text reading '${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}'".
    - **DO NOT** allow the image generator to hallucinate random dates like "2024" or "2023".
3.  **Specific Events:** If the date is near Xmas (Dec), add "Christmas decorations".

**Dynamic Workflow:**

**STEP 1: Analyze & Research (The "Thinking" Phase)**
Check if the user's request involves:
1.  **Specific Real-World Entities** (e.g., "The latest Ferrari", "iPhone 16", "Taipei 101").
2.  **Dynamic Conditions** (e.g., "Current weather in Tokyo", "Current season fashion").
3.  **Unknown/New Concepts** (Any term you don't fully recognize visually).

> **IF** you have access to the \`Google Search Tool\` AND any of the above are detected:
> * **ACTION:** USE THE SEARCH TOOL IMMEDIATELY.
> * **SEARCH STRATEGY:** 
>   - For "Latest": Search for the specific model/version released in ${now.getFullYear()}.
>   - For "Weather/City": Search for "current weather [City] visual description" or "live webcam [City]".
>   - For "Events": Search for "current state of [Event]".
> * **SEARCH GOAL:** Find visual descriptors: Specific model names, colors, materials, shapes, lighting, and atmosphere. Do not search for history/specs, search for *looks*.

> **IF** Search Tool is NOT available OR the request is generic (e.g., "A cute cat"):
> * **ACTION:** Rely on your internal creative knowledge to hallucinate beautiful details.

**STEP 2: Construct the Prompt (The "Writing" Phase)**
Write the final image prompt following these rules:
1.  **Language:** STRICTLY English only.
2.  **Detailing:** Incorporate the specific details found in Step 1 (e.g., write "Ferrari F80" instead of "New Ferrari").
3.  **Environment:** FORCE the ${season} season visuals if the prompt is time-sensitive.
4.  **Style:** Use keywords for Imagen 4.0: "Photorealistic", "8k resolution", "Cinematic lighting", "PBR textures", "Depth of field".
5.  **No Fluff:** Do not output explanations like "I searched for...". Output ONLY the image prompt.

**STEP 3: Translation & Metadata (Internal Only)**
In addition to the final English prompt, provide:
1. A Traditional Chinese translation (zhPrompt) for display.
2. 3-5 concise descriptive tags in Traditional Chinese.

**Final Output format:**
Return ONLY a JSON object with this structure:
{
    "enPrompt": "The optimized English image generation prompt",
    "zhPrompt": "繁體中文翻譯",
    "tags": "標籤1, 標籤2, 標籤3"
}

User Input: ${prompt}
                `;

                const analysisResp = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: analysisPrompt }] }],
                        tools: tools, // NEW: Pass tools
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
        if (imageBase64 && apiKey) {
            // Priority: Image-to-Image Generation if image is provided
            try {
                console.log("Attempting Img2Img Generation via Gemini 2.0...");
                const client = new GoogleGenAI({ apiKey });

                let styleInstruction = '';
                // Check if the user is requesting a matrix/grid layout
                const isGridLayout = /九宮格|矩陣|grid|matrix|3x3|layout/i.test(finalPrompt);

                if (isGridLayout) {
                    styleInstruction = 'Reference the product identity and materials from the image, but follow the requested grid/matrix layout strictly. DO NOT replicate the composition of the reference image; only replicate the PRODUCT itself.';
                } else if (style === 'preserve') {
                    styleInstruction = 'Maintain the exact same art style, color palette, and composition as the reference image.';
                } else if (style === 'enhance') {
                    styleInstruction = 'Keep the subject but enhance quality, add more details and improve lighting.';
                } else if (style === 'transform') {
                    styleInstruction = 'Use the reference as inspiration but feel free to interpret it creatively.';
                } else {
                    styleInstruction = 'Reference the original image but apply the requested changes.';
                }

                const img2imgPrompt = isGridLayout ?
                    `
                [URGENT] SYSTEM DIRECTIVE: 3X3 BRAND GRID GENERATION
                
                OBJECTIVE: Create 9 DISTINCT high-end commercial frames in a single grid layout.
                
                VISUAL VARIETY RULES (MANDATORY):
                1. DIVERSIFY CAMERA ANGLES: Cell 1 might be eye-level, Cell 2 MUST be macro close-up, Cell 3 MUST be a dynamic angle, etc. 
                2. DIVERSIFY PERSPECTIVES: Use a mix of "Top-down (Flat Lay)", "Extreme Close-up", "Low Angle Hero Shot", and "Side Profile".
                3. DIVERSIFY BACKGROUNDS: Each cell must use the unique background described in the Prompt below (e.g., Liquid, Stone, Abstract, Studio). 
                4. DO NOT REPLICATE: Never use the same background color or lighting setup for adjacent cells.
                
                PRODUCT CONSISTENCY (HIGHEST PRIORITY):
                The UPLOADED IMAGE is for referencing the PRODUCT (Subject) details only: its shape, materials, labels, and branding.
                The COMPOSITION/ANGLE of the reference image must be IGNORED. Redraw the product inside each cell with unique camera settings.
                
                DETAILED CONCEPTS TO EXECUTE:
                ${finalPrompt}
                ` : `
                Image-to-Image Generation Task.
                Style Mode: ${styleInstruction}
                Main Subject Reference: [Image Provided]
                
                User Request: ${finalPrompt}
                `;

                const response = await client.models.generateContent({
                    model: "gemini-2.0-flash-exp-image-generation",
                    contents: [
                        { text: img2imgPrompt },
                        {
                            inlineData: {
                                data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
                                mimeType: "image/png" // Gemini usually handles this base64
                            }
                        }
                    ],
                    config: {
                        responseModalities: ["TEXT", "IMAGE"]
                    }
                });

                const fs = require('fs');
                const path = require('path');
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

                const generatedImages: string[] = [];
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData && part.inlineData.data && part.inlineData.mimeType?.startsWith('image/')) {
                        const buffer = Buffer.from(part.inlineData.data, 'base64');
                        const filename = `img2img-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
                        const filepath = path.join(uploadDir, filename);
                        fs.writeFileSync(filepath, buffer);
                        generatedImages.push(`/uploads/${filename}`);
                    }
                }

                if (generatedImages.length > 0) {
                    if (previewMode) {
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
                    finalImageUrl = generatedImages[0];
                } else {
                    const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    console.error("Img2Img returned no image, text response:", textResponse);
                    throw new Error("Failed to generate image from reference");
                }
            } catch (err: any) {
                console.error("Img2Img Generation Failed:", err);
                throw new Error("Reference Image Generation Failed: " + err.message);
            }
        } else if (provider === "gemini" && apiKey) {
            const imageEngine = body.imageEngine || "imagen"; // Default to imagen

            if (imageEngine === "gemini-native") {
                // Gemini Native Image Generation (better text rendering)
                try {
                    console.log("Attempting Gemini Native Image Generation with:", finalPrompt);
                    const client = new GoogleGenAI({ apiKey });

                    const response = await client.models.generateContent({
                        model: "gemini-2.0-flash-exp-image-generation",
                        contents: [{ text: finalPrompt }],
                        config: {
                            responseModalities: ["TEXT", "IMAGE"]
                        }
                    });

                    const fs = require('fs');
                    const path = require('path');
                    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

                    const generatedImages: string[] = [];

                    // Extract images from response
                    for (const part of response.candidates?.[0]?.content?.parts || []) {
                        if (part.inlineData && part.inlineData.data && part.inlineData.mimeType?.startsWith('image/')) {
                            const buffer = Buffer.from(part.inlineData.data, 'base64');
                            const filename = `gemini-native-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
                            const filepath = path.join(uploadDir, filename);
                            fs.writeFileSync(filepath, buffer);
                            generatedImages.push(`/uploads/${filename}`);
                        }
                    }

                    if (generatedImages.length === 0) {
                        // Fallback to Imagen if Gemini Native fails
                        console.log("Gemini Native returned no image, falling back to Imagen...");
                        throw new Error("FALLBACK_TO_IMAGEN");
                    }

                    // Gemini Native only generates 1 image
                    if (previewMode) {
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

                    finalImageUrl = generatedImages[0] || "";

                } catch (err: any) {
                    if (err.message === "FALLBACK_TO_IMAGEN") {
                        console.log("Falling back to Imagen 4.0...");
                        // Will continue to Imagen section below
                    } else {
                        console.error("Gemini Native Generation Failed:", err);
                        throw new Error("Gemini Native Generation Failed: " + err.message);
                    }
                }
            }

            // Imagen 4.0 (default, or fallback from Gemini Native)
            if (imageEngine === "imagen" || !finalImageUrl) {
                // Imagen 4.0 (default - better photorealism)
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
            }
        } else if (provider === "sd" && apiUrl) {
            console.log("SD Generation requested from:", apiUrl);
            // In a real SD implementation, we would use `finalPrompt` (English) here
            finalImageUrl = `https://picsum.photos/seed/${finalSeed}/${width}/${height}`;
        } else {
            // Mock
            finalImageUrl = `https://picsum.photos/seed/${finalSeed}/${width}/${height}`;
        }

        // Prepend Engine information to tags for frontend display
        const imageEngine = body.imageEngine || (provider === "gemini" ? "imagen" : provider);
        const finalTags = `Engine:${imageEngine}${tagsResult ? `, ${tagsResult}` : ""}`;

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
                tags: finalTags,
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
                tags: body.imageEngine ? `Engine:${body.imageEngine}${tags ? `, ${tags}` : ""}` : (tags || ""),
            }
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error('Failed to save selected image:', error);
        return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
    }
}
