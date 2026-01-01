export const ASPECT_RATIOS = [
    { label: "1:1", width: 1024, height: 1024 },
    { label: "16:9", width: 1216, height: 684 }, // Standard 16:9 ish
    { label: "9:16", width: 684, height: 1216 },
    { label: "4:3", width: 1152, height: 864 },
    { label: "3:4", width: 864, height: 1152 },
];

export const PROVIDERS = [
    { id: "mock", label: "Mock (測試用)" },
    { id: "gemini", label: "Google Imagen (真實生圖)" },
    { id: "sd", label: "Stable Diffusion WebUI" },
];

// --- 風格模板庫 ---
export type TemplateCategory = "Commercial" | "3D Art" | "Photography" | "Illustration";

export interface PromptTemplate {
    category: TemplateCategory;
    name: string;
    prompt: string;
    desc: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ["Commercial", "3D Art", "Photography", "Illustration"];

export const PROMPT_TEMPLATES: PromptTemplate[] = [
    {
        category: "Photography",
        name: "極致寫實 (Hyperrealistic 8K)",
        prompt: "(hyperrealistic:1.2), [subject], 8k resolution, highly detailed, realistic skin texture, cinematic lighting, shot on 35mm lens, f/1.8, depth of field, sharp focus, masterpiece, best quality, photography",
        desc: "8K 超高解析度攝影，細節極致豐富"
    },
    {
        category: "3D Art",
        name: "電影級 3D (Cinematic 3D)",
        prompt: "(3d render:1.2), [subject], unreal engine 5, octane render, ray tracing, global illumination, highly detailed, photorealistic, cinematic lighting, volumetric lighting, 8k, masterpiece",
        desc: "Unreal 5 電影級渲染，光影逼真"
    },
    {
        category: "Illustration",
        name: "動漫神作 (Anime Masterpiece)",
        prompt: "(anime:1.2), [subject], studio ghibli style, makoto shinkai style, vibrant colors, detailed background, masterpiece, best quality, highly detailed, 4k, cinematic composition, emotional",
        desc: "吉卜力/新海誠風格，精美背景"
    },
    {
        category: "Illustration",
        name: "概念藝術 (Concept Art)",
        prompt: "(concept art:1.2), [subject], digital painting, artstation trending, matte painting, highly detailed, sharp focus, epic scale, illustration, masterpiece, best quality, fantasy art",
        desc: "ArtStation 概念畫，史詩感強烈"
    },
    {
        category: "Commercial",
        name: "賽博龐克 (Cyberpunk)",
        prompt: "(cyberpunk:1.2), [subject], neon lights, futuristic city, sci-fi, highly detailed, synthwave, retrofuturism, night time, reflection, glowing, cinematic lighting, masterpiece",
        desc: "霓虹科幻風格，未來感十足"
    }
];
