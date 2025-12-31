import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// AI 繪圖專業術語（不翻譯）
const PRESERVE_TERMS = [
    "bokeh", "HDR", "8K", "4K", "UHD", "RAW", "DSLR", "f/1.4", "f/1.8", "f/2.8",
    "aperture", "ISO", "shutter", "macro", "wide-angle", "telephoto", "tilt-shift",
    "Octane Render", "Unreal Engine", "V-Ray", "Cinema 4D", "Blender", "ZBrush",
    "ray tracing", "global illumination", "ambient occlusion", "subsurface scattering",
    "PBR", "HDRI", "low poly", "voxel", "isometric",
    "anime", "manga", "chibi", "kawaii", "moe", "bishoujo", "shounen", "seinen",
    "cyberpunk", "steampunk", "dieselpunk", "solarpunk", "biopunk",
    "art nouveau", "art deco", "baroque", "rococo", "impressionism", "surrealism",
    "Midjourney", "Stable Diffusion", "DALL-E", "LoRA", "ControlNet", "img2img",
    "CFG scale", "denoising", "inpainting", "outpainting", "upscale",
    "depth of field", "motion blur", "lens flare", "chromatic aberration", "vignette",
    "Rembrandt lighting", "rim lighting", "backlight", "golden hour", "blue hour",
    "chiaroscuro", "high key", "low key", "split lighting"
];

export async function POST(request: Request) {
    try {
        const { text, apiKey, targetLang } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const client = new GoogleGenAI({ apiKey: key });
        const isToZh = targetLang === 'zh-TW' || targetLang === 'zh';

        // 建立保留詞列表說明
        const preserveNote = `
IMPORTANT: The following technical terms should NOT be translated (keep in English):
${PRESERVE_TERMS.slice(0, 30).join(", ")}...

These are professional AI art and photography terms that must remain in English for prompt compatibility.
`;

        const translatePrompt = isToZh
            ? `你是專業的 AI 繪圖 Prompt 翻譯專家。將以下英文圖片生成提示詞翻譯成繁體中文。

${preserveNote}

原文：
"${text}"

輸出 JSON 格式：
{
    "translated": "繁體中文翻譯結果",
    "preservedTerms": ["保留的英文術語列表"],
    "summary": "一句話摘要"
}`
            : `You are an expert AI Art Prompt Engineer. Translate the following Chinese description into a professional English image generation prompt.

${preserveNote}

Chinese input: "${text}"

Rules:
- Output a professional, detailed English prompt optimized for image generation
- Add quality enhancement keywords naturally
- Include style, mood, and technical descriptors
- Keep it under 100 words
- No NSFW content

Output JSON format:
{
    "translated": "English prompt result",
    "enhanced": "Enhanced version with more keywords",
    "keywords": ["key", "tags", "extracted"]
}`;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: translatePrompt }],
            config: {
                responseMimeType: "application/json",
                temperature: 0.3
            }
        });

        const responseText = response.text || "";

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json({
                original: text,
                translated: data.translated || "",
                enhanced: data.enhanced || data.translated || "",
                keywords: data.keywords || data.preservedTerms || [],
                summary: data.summary || ""
            });
        } catch {
            // 回退：純文字
            return NextResponse.json({
                original: text,
                translated: responseText.trim()
            });
        }

    } catch (error: any) {
        console.error("Translation error:", error);
        return NextResponse.json(
            { error: error.message || "Translation failed" },
            { status: 500 }
        );
    }
}
