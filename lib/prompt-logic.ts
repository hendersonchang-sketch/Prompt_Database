// --- 終極強化思考版 v2 (8 場景 + 動態鏡頭/光線/風格) ---
export const LOGIC_PREFIX = "Analyze the core emotion and physical attributes of the scene. Think step-by-step: Prioritize lighting for narrative impact, and texture for absolute fidelity.";

// 通用畫質後綴 (所有場景)
export const QUALITY_SUFFIX_BASE = "Masterpiece, best quality, ultra-detailed, 8k resolution, sharp focus";

// 場景專用畫質後綴
export const RENDER_3D_SUFFIX = "Unreal Engine 5 render, Octane Render, Ray Tracing, Global Illumination, Ambient Occlusion";
export const PHOTO_SUFFIX = "HDR, Studio quality, Award winning photography";
export const INTERIOR_SUFFIX = "V-Ray render, Architectural visualization, Realistic materials";

// 場景判斷詞典 (8 類)
export const SCENE_KEYWORDS = {
    macro: ["macro", "closeup", "close-up", "detail", "texture", "jewelry", "watch", "insect", "ring", "diamond"],
    portrait: ["portrait", "face", "headshot", "expression", "selfie", "bust shot"],
    fullBody: ["full body", "standing", "environmental portrait", "fashion", "model", "outfit"],
    architecture: ["architecture", "interior", "room", "building", "structure", "facade", "skyscraper"],
    landscape: ["landscape", "cityscape", "panorama", "vista", "scenery", "mountain", "ocean", "sunset", "sunrise"],
    action: ["action", "dynamic", "motion", "running", "flying", "jump", "explosion", "sport", "dance"],
    food: ["food", "dish", "cuisine", "meal", "dessert", "coffee", "drink", "restaurant", "plating"],
    animal: ["animal", "wildlife", "bird", "lion", "tiger", "cat", "dog", "horse", "pet"],
    // 新增 3D/CG 場景
    render3d: ["3d", "render", "cg", "blender", "game asset", "voxel", "low poly", "isometric", "octane", "unreal"],
};

// 場景對應的鏡頭/光圈/光線/風格
export const SCENE_PROFILES: Record<string, { lens: string; lighting: string; style: string }> = {
    macro: {
        lens: "100mm Macro, f/2.8 aperture",
        lighting: "Soft diffused lighting, light tent",
        style: "professional product photography, luxurious detail"
    },
    portrait: {
        lens: "85mm, f/1.8 aperture",
        lighting: "Softbox Lighting, Rembrandt Lighting, creamy bokeh",
        style: "professional fashion photography, editorial style"
    },
    fullBody: {
        lens: "35mm, f/2.8 aperture",
        lighting: "Natural Lighting, Golden Hour, environmental context",
        style: "high-end fashion editorial, clean composition"
    },
    architecture: {
        lens: "24mm Tilt-Shift, f/8 aperture",
        lighting: "Blue Hour, Natural Lighting, balanced exposure",
        style: "architectural photography, clean geometric lines"
    },
    landscape: {
        lens: "14mm Ultra Wide, f/11 aperture",
        lighting: "Magic Hour, Dramatic Clouds, HDR",
        style: "national geographic style, epic cinematic"
    },
    action: {
        lens: "70-200mm, f/2.8 aperture",
        lighting: "High Speed Flash, Rim Light, frozen motion",
        style: "sports photography, dynamic energy"
    },
    food: {
        lens: "50mm, f/2.8 aperture",
        lighting: "Side Lighting, Natural Daylight from Window",
        style: "professional food photography, appetizing"
    },
    animal: {
        lens: "200mm, f/4 aperture",
        lighting: "Natural Lighting, soft fill",
        style: "wildlife photography, intimate moment"
    },
    render3d: {
        lens: "50mm, f/8 aperture",
        lighting: "Studio HDRI, Three-point Lighting",
        style: "3D visualization, digital art"
    },
    default: {
        lens: "50mm, f/2.8 aperture",
        lighting: "Cinematic Lighting, balanced",
        style: "professional photography"
    }
};

// 場景對應的專用畫質後綴
export const SCENE_QUALITY_SUFFIX: Record<string, string> = {
    macro: PHOTO_SUFFIX,
    portrait: PHOTO_SUFFIX,
    fullBody: PHOTO_SUFFIX,
    architecture: INTERIOR_SUFFIX,
    landscape: PHOTO_SUFFIX,
    action: PHOTO_SUFFIX,
    food: PHOTO_SUFFIX,
    animal: PHOTO_SUFFIX,
    render3d: RENDER_3D_SUFFIX,
    default: PHOTO_SUFFIX
};

// 衝突詞清理列表
export const CONFLICT_WORDS = ["lens", "aperture", "mm,", "f/", "shot on"];

export function applyUltimateMasterFilter(basePrompt: string, engineType: string): string {
    const promptLower = basePrompt.toLowerCase();

    // --- 場景判斷 ---
    let detectedScene = "default";

    for (const [scene, keywords] of Object.entries(SCENE_KEYWORDS)) {
        if (keywords.some(k => promptLower.includes(k))) {
            detectedScene = scene;
            break; // 取第一個匹配的場景
        }
    }

    const profile = SCENE_PROFILES[detectedScene] || SCENE_PROFILES.default;
    const sceneQualitySuffix = SCENE_QUALITY_SUFFIX[detectedScene] || SCENE_QUALITY_SUFFIX.default;

    // --- 衝突詞清理 ---
    let cleanedPrompt = basePrompt;
    for (const word of CONFLICT_WORDS) {
        // 使用正則移除包含衝突詞的片段 (簡單處理)
        const regex = new RegExp(`[^,]*${word}[^,]*,?`, 'gi');
        cleanedPrompt = cleanedPrompt.replace(regex, '');
    }
    cleanedPrompt = cleanedPrompt.replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').trim();

    // --- 組合最終 Prompt (引擎感知模式) ---
    let parts: string[] = [];

    if (engineType === 'flash') {
        // Flash 模式：精簡指令，避免過長，僅保留核心與基本畫質
        parts = [
            cleanedPrompt,
            profile.style,
            QUALITY_SUFFIX_BASE
        ];
    } else {
        // Pro/Imagen 模式：全開強化邏輯
        parts = [
            LOGIC_PREFIX,
            cleanedPrompt,
            profile.lens,
            profile.lighting,
            profile.style,
            QUALITY_SUFFIX_BASE,
            sceneQualitySuffix
        ];
    }

    let finalPrompt = parts.join(", ").trim();

    // 最終清理
    finalPrompt = finalPrompt.replace(/, ,/g, ",").replace(/\.\.+/g, ".").replace(/\. ,/g, ".,").trim();
    if (!finalPrompt.endsWith(".")) {
        finalPrompt += ".";
    }

    return finalPrompt;
}
