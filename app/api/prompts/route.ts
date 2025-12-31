import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import sharp from 'sharp';
import { generateImage } from '@/services/geminiImageService';

const MASTER_ALCHEMIST_INSTRUCTION = `
### 🔮 [MASTER ALCHEMIST MODE: ON]
You are now in Master Alchemist Mode. Your goal is to transform the user's input into an ELITE-LEVEL masterpiece prompt.
1. **Artistic Precision**: Focus on high-fidelity technical details and artistic craftsmanship. Use descriptions of lighting, texture, and composition to elevate the prompt.
2. **Technically Rich**: Instead of "high quality", use technical terms: "Volumetric lighting", "Ray-tracing", "Global illumination", "PBR materials", "8k resolution photorealistic", "Subsurface scattering of light on materials".
3. **Environmental Alchemy**: Describe the atmosphere, dust motes in sunbeams, subtle lens flares, and the interplay of shadows.
4. **Compositional Drama**: Define specific camera setups: "Cinematic wide sweep", "Micro-macro close-up with soft bokeh", "Crisp architectural line perspective".
5. **SAFETY PROTOCOL**: Ensure generated descriptions are graceful, professional, and strictly adhere to AI safety guidelines. Avoid sexually suggestive, violent, or overly aggressive descriptions.
6. **JSON Response**: You MUST return a JSON object containing:
   - "enPrompt": The master-level English prompt.
   - "zhPrompt": A poetic Traditional Chinese translation.
   - "tags": 5-8 artistic tags.
   - "suggested_aspect_ratio": "16:9", "9:16", or "1:1" based on the artistic vision.
   - "negative_prompt": Technical negative prompts (e.g., "blurry, low resolution, distorted") to ensure elite quality.
`;

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
            useSearch = false, // NEW: Trigger for Google Search Retrieval
            useMagicEnhance = false // NEW: Trigger for AI Prompt Alchemist
        } = body;

        // Ensure imageCount is an integer and within bounds
        const parsedImageCount = Math.min(Math.max(parseInt(String(imageCount)) || 1, 1), 4);

        // Initialize Bilingual Data
        let finalPrompt = prompt;
        let promptZh = "";
        let originalPrompt = prompt;
        let finalImageUrl = "";
        let tagsResult = provider;
        let finalNegativePrompt = negativePrompt || "";
        let finalWidth = width;
        let finalHeight = height;
        let isEnhanced = false;

        // Parallel Processing for Translation & Tagging (Only if API Key is present)
        if (apiKey) {
            try {
                // Use available model from diagnostic list: gemini-2.5-flash
                let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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

                // [NEW] PROMPT INTERCEPTION FOR SMART SEARCH
                // If the user wants "Latest" and Search is ON, we must intercept to prevent "2024" results.
                let searchOptimizedPrompt = prompt;
                if (useSearch) {
                    const lower = prompt.toLowerCase();
                    const techTriggers = ['iphone', 'galaxy', 'samsung', 'pixel', 'ferrari', 'car', 'tech', 'laptop', 'gpu', 'nvidia'];
                    const timeTriggers = ['latest', 'newest', 'current', 'next gen', 'future'];

                    const hasTech = techTriggers.some(t => lower.includes(t));
                    const hasTime = timeTriggers.some(t => lower.includes(t));

                    if (hasTech && hasTime) {
                        const nextYear = now.getFullYear() + 1;
                        // Force-inject the "Future Concept" intent directly into the User Input slot
                        searchOptimizedPrompt += ` \n\n(SYSTEM OVERRIDE: The user is asking about the FUTURE ${nextYear} model. DO NOT search for old released products. SEARCH QUERY MUST BE: '${prompt} concept design rumors ${nextYear}' or 'future design leaks ${nextYear}'. Ignore old models.)`;
                        console.log(`Smart Search Intercepted: Injected ${nextYear} Bias.`);
                    }
                }

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

**MANDATORY INSTRUCTION ON "SMART SEARCH" BEHAVIOR:**
**PROTOCOL: GROUND-TRUTH SEARCHING (Strict Enforcement)**
1.  **QUERY DYNAMICS:**
    -   **Current Year:** ${now.getFullYear()} (Dec 2025 is the current context).
    -   **Next Evolution:** ${now.getFullYear() + 1}.
    -   **Problem:** Searching "Latest [Product]" often returns outdated SEO-optimized 2024 reviews.
    -   **Solution:** You MUST explicitly include the year "**${now.getFullYear() + 1}**" in your internal search thought process.
2.  **EXAMPLE MAPPINGS:**
    -   User: "Latest iPhone" -> **Search:** "iPhone 18 concept leaks ${now.getFullYear() + 1} design" (Targeting the next cycle).
    -   User: "Latest Ferrari" -> **Search:** "Ferrari 2026 hypercar lineup rumors".
3.  **RESULT VALIDATION:**
    -   **TRUST** search results that mention "**2026**" or "**Late 2025**".
    -   **IGNORE** anything dated 2024 or older as "Legacy/Historical".
    -   If the search provides visual details of a prototype, **USE THEM** instead of generic training data.

**PROTOCOL: TRADITIONAL CHINESE TYPOGRAPHY (Accuracy Boost)**
1.  **CHARACTER DECOMPOSITION (Crucial):**
    -   If the text is "深夜食堂", describing the whole phrase is often insufficient.
    -   **ACTION:** Describe the characters individually to the model. 
    -   **EXAMPLE:** "The sign displays four vertical Traditional Chinese characters: '深' (Deep), '夜' (Night), '食' (Food), '堂' (Hall). Each character is rendered with high-fidelity traditional strokes, sharp corners, and no simplified character overlap."
2.  **CHARACTER REWRITING:**
    -   **MANDATORY:** Always explicitly state "STRICTLY Traditional Chinese (繁體中文), NO simplified characters like 无, 门, 讠".
    -   **FORMAT:** Use the exact phrase: "The text '[TEXT]' is written in premium Traditional Chinese typography with correct calligraphic structures".
3.  **VISUAL CLUES:**
    -   Specify "Black calligraphy ink style", "Neon tube geometry", or "Formal MingLiU printed style" to help the AI lock in the stroke shapes.

**DATA HIERARCHY:**
-   **Date:** ${now.toLocaleDateString('zh-TW')} (System Ground Truth).
-   **Weather:** Real-time search snippets ONLY.
-   **Products:** **Search-Verified Future Specs** ONLY.
-   **Text:** **Traditional Chinese Accuracy Mode** (If applicable).

**Dynamic Workflow:**

**STEP 1: Analyze & Research (The "Thinking" Phase)**
Check if the user's request involves:
1.  **"Latest" Tech/Products:**
    -   *Action:* **STOP.** Do not search "What is latest".
    -   *Action:* **CALCULATE** the future model (e.g. iPhone 17).
    -   *Search:* **"iPhone 17 concept design"**.
2.  **Weather/Location:**
    -   *Action:* Search "current temperature [City]".
3.  **Portraits/Humans:**
    -   *Action:* Search "2026 fashion trends" or "Pantone color of the year ${now.getFullYear() + 1}".
    -   *Action:* Apply "2026 Street Style" or "Cyber-chic" if the user asks for "modern" looks.
4.  **Objects/Industrial Design:**
    -   *Action:* Search "Trending CMF ${now.getFullYear() + 1}" (Color, Material, Finish).
    -   *Action:* Incorporate specific modern materials like "Bio-engineered fabrics", "Transparent titanium", or "Recycled aero-composites".
5.  **Time:**
    -   *Action:* USE SAFE DATE (${now.getFullYear()}).

**STEP 2: Construct the Prompt (The "Writing" Phase)**
Write the final image prompt following these rules:
1.  **Language:** STRICTLY English only (Except for the literal text inside quotes).
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

User Input: ${searchOptimizedPrompt}
                `;

                const useModel = useMagicEnhance ? "gemini-3-flash-preview" : "gemini-2.5-flash";
                const systemInstruction = (useMagicEnhance ? MASTER_ALCHEMIST_INSTRUCTION : "") + analysisPrompt;

                console.log(`🚀 Using Analysis Model: ${useModel} (Alchemy: ${useMagicEnhance})`);

                const analysisResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: searchOptimizedPrompt }] }],
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        tools: tools,
                        safetySettings: [
                            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                        ],
                        generationConfig: { responseMimeType: "application/json" }
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
                        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] Model: ${useModel}, Alchemy: ${useMagicEnhance}\nRaw Gemini Response:\n${text}\n-------------------\n`);
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

                            // Manage Alchemy suggestions
                            if (useMagicEnhance) {
                                if (result.negative_prompt) {
                                    finalNegativePrompt = result.negative_prompt;
                                }
                                // DISABLE ASPECT RATIO OVERRIDE
                                // Users want to control the ratio manually.
                                // if (result.suggested_aspect_ratio && width === 1024 && height === 1024) {
                                //     if (result.suggested_aspect_ratio === "16:9") {
                                //         finalWidth = 1216;
                                //         finalHeight = 684;
                                //     } else if (result.suggested_aspect_ratio === "9:16") {
                                //         finalWidth = 684;
                                //         finalHeight = 1216;
                                //     }
                                // }
                                isEnhanced = true;
                            }

                            console.log("Gemini Analysis Parsing Success:", { finalPrompt, finalWidth, finalHeight });
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
                // Fallback: Use current finalPrompt
            }
        }

        // 使用優化後的尺寸
        const currentWidth = finalWidth;
        const currentHeight = finalHeight;

        // Prepend Engine information to tags for frontend display
        const imageEngineName = body.imageEngine || (provider === "gemini" ? "imagen" : provider);
        const finalTags = `Engine:${imageEngineName}${tagsResult ? `, ${tagsResult}` : ""}`;

        // Seed Generation
        const finalSeed = seed && seed !== -1 ? seed : Math.floor(Math.random() * 1000000);

        // Aspect Ratio Calculation (Based on final calculated dimensions)
        // Use a small tolerance for aspect ratio matching
        const ratio = finalWidth / finalHeight;
        let finalAspectRatio = "1:1";
        if (Math.abs(ratio - (16 / 9)) < 0.1) {
            finalAspectRatio = "16:9";
        } else if (Math.abs(ratio - (9 / 16)) < 0.1) {
            finalAspectRatio = "9:16";
        } else if (ratio > 1.2) {
            finalAspectRatio = "16:9";
        } else if (ratio < 0.8) {
            finalAspectRatio = "9:16";
        }

        console.log(`Final Dimensions: ${finalWidth}x${finalHeight}, Interpreted Aspect Ratio: ${finalAspectRatio}`);

        // Provider Logic (Now uses finalPrompt which is likely English)
        if (imageBase64 && apiKey) {
            // Priority: Image-to-Image Generation if image is provided
            try {
                console.log("Attempting Img2Img Generation via Gemini 2.5...");
                const client = new GoogleGenAI({ apiKey });

                let styleInstruction = '';
                if (style === 'preserve') {
                    styleInstruction = 'Maintain the exact same art style, color palette, and composition as the reference image.';
                } else if (style === 'enhance') {
                    styleInstruction = 'Keep the subject but enhance quality, add more details and improve lighting.';
                } else if (style === '3d') {
                    const isInterior = /interior|room|floor plan|apartment|furniture/i.test(finalPrompt);
                    const isMap = /map|blueprint|cityscape|landscape|terrain/i.test(finalPrompt);

                    if (isInterior) {
                        styleInstruction = 'EVOLUTION TASK: Transform this 2D floor plan/sketch into a professional 3D Architectural Visualization. Use V-Ray or Corona Render style, realistic lighting, high-end materials, and photorealistic textures. Create a cohesive 3D room based on the 2D layout.';
                    } else if (isMap) {
                        styleInstruction = 'EVOLUTION TASK: Transform this 2D map/blueprint into a 3D Isometric Diorama. Use a clean miniature style, tilt-shift photography effect, and detailed simplified elements. Make it look like a high-quality physical 3D model.';
                    } else {
                        styleInstruction = 'EVOLUTION TASK: Transform this 2D reference (sketch, flat art, or photo) into a high-end 3D masterpiece. Use Octane Render style, Unreal Engine 5 aesthetic, and PBR materials. Ignore the original 2D art style; apply realistic depth, shadows, and cinematic global illumination. Maintain the SUBJECT only.';
                    }
                } else {
                    styleInstruction = 'Reference the original image but apply the requested changes.';
                }

                const img2imgPrompt = `
                Image-to-Image Generation Task.
                Style Mode: ${styleInstruction}
                Main Subject Reference: [Image Provided]
                
                User Request: ${finalPrompt}
                `;

                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

                const payload = {
                    contents: [
                        {
                            parts: [
                                { text: img2imgPrompt },
                                {
                                    inlineData: {
                                        data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
                                        mimeType: "image/png"
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        responseModalities: ["IMAGE"],
                        imageConfig: {
                            aspectRatio: finalAspectRatio
                        }
                    }
                };

                // Log Img2Img params
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const logPath = path.join(process.cwd(), 'debug_log.txt');
                    fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] ENGINE: Img2Img (gemini-2.5-flash-image)\nENDPOINT: generateContent, ASPECT RATIO: ${finalAspectRatio}\nPROMPT: ${img2imgPrompt}\n-------------------\n`);
                } catch (e) { }

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const responseText = await response.text();
                if (!response.ok) throw new Error(`Img2Img API Error (${response.status}): ${responseText}`);

                const data = JSON.parse(responseText);

                const fs = require('fs');
                const path = require('path');
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

                const generatedImages: string[] = [];

                if (data.candidates && data.candidates[0]?.content?.parts) {
                    for (const part of data.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.data && part.inlineData.mimeType?.startsWith('image/')) {
                            const buffer = Buffer.from(part.inlineData.data, 'base64');
                            const extension = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg';
                            const filename = `img2img-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
                            const filepath = path.join(uploadDir, filename);
                            fs.writeFileSync(filepath, buffer);
                            generatedImages.push(`/uploads/${filename}`);
                        }
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
                            negativePrompt: finalNegativePrompt
                        });
                    }
                    finalImageUrl = generatedImages[0];
                } else {
                    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    console.error("Img2Img returned no image, text response:", textResponse);
                    throw new Error("Failed to generate image from reference");
                }
            } catch (err: any) {
                console.error("Img2Img Generation Failed:", err);

                // Allow Quota errors to pass through clearly
                if (err.message && (err.message.includes('429') || err.message.includes('Quota'))) {
                    throw new Error("Quota Exceeded");
                }

                // Handle Google 500 Internal Errors
                if (err.message && (err.message.includes('500') || err.message.includes('INTERNAL'))) {
                    throw new Error("Google AI Service Error (500): The image generation service is temporarily failing. Please try again later or use a smaller reference image.");
                }

                throw new Error("Reference Image Generation Failed: " + (err.message || "Unknown Error"));
            }
        } else if (provider === "gemini" && apiKey) {
            const imageEngine = body.imageEngine || "imagen"; // Default to imagen

            if (imageEngine === "pro" || imageEngine === "flash" || imageEngine === "gemini-native") {
                // Gemini Native Image Generation (better text rendering)
                try {
                    console.log(`Attempting Gemini Native REST Generation (${imageEngine}) with:`, finalPrompt);

                    const modelName = imageEngine === "pro"
                        ? "gemini-3-pro-image-preview"
                        : "gemini-2.5-flash-image";

                    // Use :generateContent instead of :predict for Gemini Native models
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                    // Build payload for generateContent
                    const payload = {
                        contents: [{ parts: [{ text: finalPrompt }] }],
                        generationConfig: {
                            responseModalities: ["IMAGE"],
                            imageConfig: {
                                aspectRatio: finalAspectRatio
                            }
                        }
                    };

                    // Log parameters for verification
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const logPath = path.join(process.cwd(), 'debug_log.txt');
                        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] ENGINE: ${imageEngine}, MODEL: ${modelName}\nENDPOINT: generateContent, ASPECT RATIO: ${finalAspectRatio}\nPROMPT: ${finalPrompt}\n-------------------\n`);
                    } catch (e) { }

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const responseText = await response.text();
                    if (!response.ok) throw new Error(`Gemini Native API Error (${response.status}): ${responseText}`);

                    const data = JSON.parse(responseText);

                    const fs = require('fs');
                    const path = require('path');
                    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

                    const generatedImages: string[] = [];

                    // Extract images from generateContent response format
                    if (data.candidates && data.candidates[0]?.content?.parts) {
                        for (const part of data.candidates[0].content.parts) {
                            if (part.inlineData && part.inlineData.data && part.inlineData.mimeType?.startsWith('image/')) {
                                const buffer = Buffer.from(part.inlineData.data, 'base64');
                                const extension = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg';
                                const filename = `gemini-native-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
                                const filepath = path.join(uploadDir, filename);
                                fs.writeFileSync(filepath, buffer);
                                generatedImages.push(`/uploads/${filename}`);
                            }
                        }
                    }

                    if (generatedImages.length === 0) {
                        console.log("Gemini Native REST returned no image, falling back to Imagen...");
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
                            tags: finalTags,
                            width: finalWidth,
                            height: finalHeight,
                            seed: finalSeed,
                            cfgScale,
                            steps,
                            negativePrompt: finalNegativePrompt,
                            isEnhanced: useMagicEnhance,
                            usedPrompt: finalPrompt,
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
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict?key=${apiKey}`;

                    // Build payload (referenceImages disabled - needs Vertex AI)
                    const payload = {
                        instances: [{ prompt: finalPrompt }],
                        parameters: {
                            sampleCount: parsedImageCount,
                            aspectRatio: finalAspectRatio,
                            safetySetting: "block_low_and_above",
                            personGeneration: "allow_adult",
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
                                // Directly write raw bytes (Imagen 4 returns PNG by default)
                                const filename = `imagen-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.png`;
                                const filepath = path.join(uploadDir, filename);
                                fs.writeFileSync(filepath, buffer);
                                generatedImages.push(`/uploads/${filename}`);
                            }
                        }

                        const imageEngineName = body.imageEngine || (provider === "gemini" ? "imagen" : provider);
                        const finalTags = `Engine:${imageEngineName}${tagsResult ? `, ${tagsResult}` : ""}`;

                        // If preview mode or multiple images, return array without saving to DB
                        if (previewMode || parsedImageCount > 1) {
                            return NextResponse.json({
                                previewMode: true,
                                images: generatedImages,
                                partialResults: generatedImages.length < parsedImageCount,
                                requestedCount: parsedImageCount,
                                actualCount: generatedImages.length,
                                prompt: finalPrompt,
                                originalPrompt: originalPrompt,
                                promptZh: promptZh,
                                tags: finalTags,
                                width: finalWidth,
                                height: finalHeight,
                                seed: finalSeed,
                                cfgScale,
                                steps,
                                negativePrompt: finalNegativePrompt,
                                isEnhanced: useMagicEnhance,
                                usedPrompt: finalPrompt,
                            });
                        }

                        // Single image, save directly
                        finalImageUrl = generatedImages[0] || "";
                    } else {
                        throw new Error("Google AI 安全過濾：您的提示詞可能包含不符規範的內容，或者 AI 無法針對該描述生成影像，請嘗試簡化或更換提示詞。");
                    }

                } catch (err: any) {
                    console.error("Imagen Gen Failed:", err);

                    // Log the final prompt that caused failure
                    try {
                        const fs = require('fs');
                        const path = require('path');
                        const logPath = path.join(process.cwd(), 'debug_log.txt');
                        fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] IMAGEN FAILURE:\nPrompt: ${finalPrompt}\nError: ${err.message}\n-------------------\n`);
                    } catch (logErr) { }

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

        // 使用生成的種子碼
        const finalSeedVal = finalSeed;

        const entry = await prisma.promptEntry.create({
            data: {
                prompt: finalPrompt, // English / Optimized
                originalPrompt: originalPrompt, // What user typed
                promptZh: promptZh, // Chinese Display
                negativePrompt: finalNegativePrompt,
                imageUrl: finalImageUrl,
                width: finalWidth,
                height: finalHeight,
                sampler,
                seed: finalSeed,
                cfgScale,
                steps,
                tags: finalTags,
            }
        });

        // 如果使用了 Magic Enhance，在回傳物件中標註並提供最終提示詞
        const responseData = {
            ...entry,
            isEnhanced: useMagicEnhance,
            usedPrompt: finalPrompt // 回傳增強後的完整英文提示詞
        };
        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error('Failed to create prompt:', error);

        // [NEW] Intelligent Error Handling for Quota
        const isQuotaError = error?.message?.includes('429') || error?.message?.includes('Quota exceeded');

        if (isQuotaError) {
            return NextResponse.json({
                error: 'Quota Exceeded',
                details: 'Daily image generation limit reached (429). Reset at midnight PST.',
                stack: error?.stack
            }, { status: 429 });
        }

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
