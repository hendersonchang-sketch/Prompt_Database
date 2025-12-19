"use client";

import { useState, useEffect, useRef } from "react";
import CharacterManager from "./CharacterManager";

interface PromptFormProps {
    onSuccess: () => void;
    initialData?: any; // Accepting reuse data
}

const ASPECT_RATIOS = [
    { label: "1:1", width: 1024, height: 1024 },
    { label: "16:9", width: 1216, height: 684 }, // Standard 16:9 ish
    { label: "9:16", width: 684, height: 1216 },
    { label: "4:3", width: 1152, height: 864 },
    { label: "3:4", width: 864, height: 1152 },
];

const PROVIDERS = [
    { id: "mock", label: "Mock (測試用)" },
    { id: "gemini", label: "Google Imagen (真實生圖)" },
    { id: "sd", label: "Stable Diffusion WebUI" },
];

// --- 終極強化思考版 v2 (8 場景 + 動態鏡頭/光線/風格) ---
const LOGIC_PREFIX = "Analyze the core emotion and physical attributes of the scene. Think step-by-step: Prioritize lighting for narrative impact, and texture for absolute fidelity.";

// 通用畫質後綴 (所有場景)
const QUALITY_SUFFIX_BASE = "Masterpiece, best quality, ultra-detailed, 8k resolution, sharp focus";

// 場景專用畫質後綴
const RENDER_3D_SUFFIX = "Unreal Engine 5 render, Octane Render, Ray Tracing, Global Illumination, Ambient Occlusion";
const PHOTO_SUFFIX = "HDR, Studio quality, Award winning photography";
const INTERIOR_SUFFIX = "V-Ray render, Architectural visualization, Realistic materials";

// 場景判斷詞典 (8 類)
const SCENE_KEYWORDS = {
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
const SCENE_PROFILES: Record<string, { lens: string; lighting: string; style: string }> = {
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
const SCENE_QUALITY_SUFFIX: Record<string, string> = {
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
const CONFLICT_WORDS = ["lens", "aperture", "mm,", "f/", "shot on"];

function applyUltimateMasterFilter(basePrompt: string, engineType: string): string {
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

// --- 風格模板庫 ---
type TemplateCategory = "Commercial" | "3D Art" | "Photography" | "Illustration" | "Fine Art" | "Texture & FX";

interface PromptTemplate {
    category: TemplateCategory;
    name: string;
    prompt: string;
    desc: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
    // ==========================================
    // Group 1: 商業設計與品牌 (Commercial & Branding)
    // ==========================================
    { category: "Commercial", name: "Logo 設計", prompt: "Minimalist vector logo of [主體], flat design, simple geometric shapes, white background, professional corporate identity.", desc: "簡約向量標誌" },
    { category: "Commercial", name: "App 圖示", prompt: "Modern mobile app icon of [主體], rounded corners, gradient background, minimalist vector, ios style, high quality.", desc: "手機圖示" },
    { category: "Commercial", name: "UI 介面", prompt: "Mobile app UI design for [主體], modern glassmorphism style, clean layout, user friendly, high fidelity mockup, dribbble aesthetic.", desc: "現代化 App 介面" },
    { category: "Commercial", name: "向量貼紙", prompt: "Die-cut sticker design of [主體], white border, vector art, vibrant colors, flat shading, simple background.", desc: "Line/Telegram 貼圖" },
    { category: "Commercial", name: "貼紙包", prompt: "A sticker sheet containing multiple poses of [主體], white borders, die-cut style, vector art, cute and vibrant.", desc: "多款貼紙" },
    { category: "Commercial", name: "T-Shirt 印花", prompt: "Vector t-shirt design of [主體], bold lines, isolated on black background, pop art style, high contrast, merchandise ready.", desc: "潮流服飾圖案" },
    { category: "Commercial", name: "霓虹招牌", prompt: "Glowing neon sign of [主體] on a brick wall at night, vibrant colors, reflection, electric atmosphere, cyberpunk vibe.", desc: "發光招牌" },
    { category: "Commercial", name: "商業攝影", prompt: "A professional product photography of [主體], studio lighting, solid neutral background, 8k resolution, ultra sharp focus, commercial quality.", desc: "商品展示，純淨背景" },
    { category: "Commercial", name: "開箱平鋪", prompt: "Knolling photography of [主體] parts, organized neatly at 90 degree angles, flat lay, overhead view, clean background.", desc: "零件整齊排列" },
    { category: "Commercial", name: "穿搭拆解", prompt: "Fashion flat lay guide of [服裝描述], showing all clothing items and accessories separated and arranged in knolling style. No people, no duplicated items, overhead view, neutral gray background, clean and organized presentation. Include: top, bottom, shoes, bag, watch, jewelry if applicable.", desc: "服裝配件平鋪展示" },
    { category: "Commercial", name: "萬用拆解", prompt: "Photorealistic exploded view of [物品名稱], showing all real components and parts floating separately in 3D space against a clean white studio background. Professional product photography style, studio lighting, high resolution 8K, each part clearly visible with realistic materials and textures. Parts arranged to show assembly structure, commercial catalog quality.", desc: "任何物品的寫實爆炸圖" },
    { category: "Commercial", name: "拆解+標註", prompt: "Technical exploded view diagram of [物品名稱] with English text labels pointing to each component. Each part has a clean line connecting to its name in clear English typography. Professional infographic style, white background, sans-serif font, educational reference diagram showing part names and functions. High resolution, clean modern design.", desc: "英文標註拆解圖" },
    { category: "Commercial", name: "產品樣機", prompt: "Blank product mockup of [主體] on a wooden table, natural sunlight, shadow overlay, minimalist aesthetic, high resolution.", desc: "設計合成用" },
    { category: "Commercial", name: "藍圖資訊圖", prompt: "Create an infographic image of [主體], combining a real photograph with blueprint-style technical annotations and diagrams overlaid. Include the title \"[主體]\" in a hand-drawn box in the corner. Add white chalk-style sketches showing key structural data, important measurements, material quantities, internal diagrams, load-flow arrows, cross-sections, and notable features. Style: blueprint aesthetic with white line drawings on the photograph, technical annotation style, educational infographic feel, with the real environment visible behind the annotations.", desc: "照片+藍圖標註疊合" },
    { category: "Commercial", name: "產品三視圖", prompt: "Professional product design reference showing [產品描述] in three views: front view, side view, and top view (or interior view if applicable). Studio photography style, neutral gray background, soft even lighting, high resolution, clean and minimal presentation for designer and manufacturer reference.", desc: "產品設計參考圖" },

    // ==========================================
    // Group 2: 3D 藝術與遊戲資產 (3D Art & Game Assets)
    // ==========================================
    { category: "3D Art", name: "商品化公仔", prompt: "Create a hyper-realistic 1/7 scale commercialized figurine of [角色描述], presented as a finished collectible product in a real-world setting. The figurine is displayed on a computer desk, standing on a clean, round transparent acrylic base with no labels or text. In the background, the computer screen shows the ZBrush modeling process of this same figurine, highlighting the contrast between the ongoing \"work in progress\" digital sculpt and the completed physical product on the desk. Next to the figurine, include a professionally designed packaging box with rounded corners, a transparent front window, and realistic commercial details.", desc: "角色轉商品模型展示" },
    { category: "3D Art", name: "3D 盲盒", prompt: "Cute 3D blind box toy of [主體], chibi style, soft smooth lighting, pastel colors, isometric view, plastic material, octane render.", desc: "可愛 Q 版公仔" },
    { category: "3D Art", name: "3D 渲染", prompt: "High quality 3D render of [主體], unreal engine 5, ray tracing, realistic textures, cinematic lighting, 8k.", desc: "擬真 3D 渲染" },
    { category: "3D Art", name: "等距微縮", prompt: "Cute isometric 3D render of [主體], low poly style, soft pastel colors, blender 3d, orthographic view, minimal background.", desc: "3D 微縮模型（可愛風）" },
    { category: "3D Art", name: "等距微縮 PBR", prompt: "A clear 45° top-down isometric miniature 3D scene of [主體], featuring detailed architectural elements. [WEATHER:Integrate current realistic weather conditions into the scene atmosphere] [TIME:Current time of day lighting and mood] Soft refined textures with realistic PBR materials, gentle lifelike lighting and shadows. Clean minimalistic composition with soft solid-colored background, museum diorama quality, hyperrealistic detail.", desc: "3D 微縮（寫實）可刪[WEATHER][TIME]" },
    { category: "3D Art", name: "等距房間", prompt: "Isometric cutaway render of a [主體] room, 3d blender style, cozy lighting, detailed furniture, diorama style.", desc: "3D 小房間剖面（可愛風）" },
    { category: "3D Art", name: "等距房間 PBR", prompt: "A clear 45° top-down isometric cutaway of a [主體] room interior. Realistic PBR materials, refined textures on furniture and walls, soft natural lighting with gentle shadows. Detailed props and decorations, architectural visualization quality, clean solid-colored background.", desc: "3D 小房間剖面（寫實風）" },
    { category: "3D Art", name: "遊戲資產", prompt: "Isometric game asset of [主體], low poly style, stylized hand-painted texture, isolated on black background, unity 3d asset.", desc: "遊戲道具去背" },
    { category: "3D Art", name: "體素藝術", prompt: "Voxel art of [主體], 3d pixel style, minecraft aesthetic, blocky, vibrant colors, isometric view.", desc: "麥塊方塊風格" },
    { category: "3D Art", name: "低多邊形", prompt: "Low poly 3d art of [主體], geometric shapes, flat shading, minimalist style, pastel colors, blender render.", desc: "幾何簡約 3D" },
    { category: "3D Art", name: "黏土動畫", prompt: "Stop-motion claymation style of [主體], plasticine texture, fingerprint details, soft lighting, aardman style.", desc: "黏土質感動畫" },
    { category: "3D Art", name: "角色三視圖", prompt: "Character design reference sheet of [主體描述], showing front view, side view, and back view, T-pose, full body, neutral expression, consistent design across all views, white background, clean linework, professional concept art, highly detailed, anime style.", desc: "角色一致性設定圖" },
    { category: "3D Art", name: "表情包", prompt: "Character expression sheet of [主體], showing 9 different emotions: happy, sad, angry, surprised, shy, sleepy, confused, excited, neutral, same character consistent design, white background, anime style, reference sheet.", desc: "角色表情變化" },
    { category: "3D Art", name: "動作設定", prompt: "Character action pose sheet of [主體], showing 6 dynamic poses: standing, running, jumping, sitting, fighting, sleeping, same character consistent outfit and features, white background, concept art style.", desc: "角色動態參考" },
    { category: "3D Art", name: "遊戲立繪", prompt: "Dynamic video game splash art of [主體], action pose, magical effects, high detail, league of legends style, cinematic lighting.", desc: "遊戲角色宣傳圖" },
    { category: "3D Art", name: "城市微縮", prompt: "A miniature diorama of [CITY], condensed into a tiny tabletop world. Iconic buildings simplified but recognizable, tiny people, vehicles, trees, and street details. Soft ambient lighting, tilt-shift photography style, museum-quality realism.", desc: "城市微縮模型" },
    { category: "3D Art", name: "微縮工人", prompt: "A giant [PRODUCT] positioned like a monumental structure, with intricate scaffolding and dozens of miniature [WORKER] swarming around it. They are polishing surfaces, applying details, cleaning, and inspecting. Tilt-shift macro photography style, shallow depth of field, warm cinematic lighting, hyperrealistic detail, museum diorama quality.", desc: "產品+微縮人物施工場景" },
    { category: "3D Art", name: "展示卡", prompt: "Present a clear 45° top-down isometric miniature 3D diorama of [主體]. The subject is the main focus, placed on a small raised diorama-style base that reflects its most recognizable environment, with subtle contextual details and tiny stylized figures if appropriate. Use soft refined textures, realistic PBR materials, and gentle cinematic lighting. The subject should feel premium, collectible, and instantly recognizable. Use a clean solid [BACKGROUND COLOR] background with no gradients. At the top-center, display \"[TITLE]\" in large bold text. Directly beneath it, display \"[SUBTITLE]\" in medium text. Optionally place an official logo or emblem below the text. All text must automatically match background contrast. Square 1080x1080, ultra-clean high-clarity diorama aesthetic.", desc: "萬用展示卡（載具/美食/事件）" },

    // ==========================================
    // Group 3: 專業攝影與寫實 (Photography & Realism)
    // ==========================================
    { category: "Photography", name: "人像寫真", prompt: "High-end editorial portrait of [主體], shot on 85mm lens, f/1.8 aperture, soft cinematic lighting, detailed skin texture, bokeh background.", desc: "專業人像攝影" },
    { category: "Photography", name: "建築攝影", prompt: "Modern minimalist architecture of [主體], concrete and glass materials, natural lighting, blue hour, wide angle shot, architectural digest style.", desc: "現代建築大片" },
    { category: "Photography", name: "室內設計", prompt: "Interior design photography of a [主體], scandinavian style, cozy atmosphere, morning sunlight, photorealistic, 8k, architectural digest.", desc: "居家裝潢參考" },
    { category: "Photography", name: "美食攝影", prompt: "Mouth-watering food photography of [主體], macro shot, steam rising, professional plating, shallow depth of field, 4k.", desc: "誘人美食特寫" },
    { category: "Photography", name: "微距攝影", prompt: "Extreme macro photography of [主體], incredible details, sharp focus, shallow depth of field, nature documentary style.", desc: "極致細節微距" },
    { category: "Photography", name: "空拍視角", prompt: "Aerial drone shot of [主體], bird's eye view, high altitude, vast landscape, epic scale, geometric composition.", desc: "上帝視角空拍" },
    { category: "Photography", name: "黑白電影", prompt: "Black and white film noir photography of [主體], high contrast, dramatic shadows, venetian blind shadows, 1940s mystery atmosphere.", desc: "懸疑電影質感" },
    { category: "Photography", name: "拍立得", prompt: "Vintage polaroid photo of [主體], flash photography, soft focus, film grain, nostalgic vignette, casual snapshot.", desc: "復古底片感" },
    { category: "Photography", name: "移軸攝影", prompt: "Tilt-shift photography of [主體], miniature effect, blurred edges, high angle shot, toy-like appearance.", desc: "小人國模型感" },
    { category: "Photography", name: "紅外線", prompt: "Infrared photography of [主體], surreal colors, pink foliage, dreamlike atmosphere, false color.", desc: "超現實偽色" },
    { category: "Photography", name: "珠寶攝影", prompt: "High-end jewelry photography of [主體], macro shot, sparkling diamonds, gold texture, velvet background, studio lighting, luxury vibe.", desc: "奢華珠寶特寫" },
    { category: "Photography", name: "好萊塢狗仔", prompt: "A striking black-and-white cinematic photograph of [主體] standing calm and composed in the center of a dense crowd of paparazzi, dozens of photographers surrounding, all aiming vintage cameras with flashes raised. [主體] wears dark sunglasses, minimal makeup, and an elegant dark outfit, with an emotionless and powerful expression, symbolizing isolation amid fame. High contrast lighting, dramatic shadows, shallow depth of field, sharp focus on the central subject, blurred foreground faces and cameras, classic film grain, 35mm analog photography style, noir aesthetic, timeless Hollywood atmosphere, editorial fashion photography, iconic.", desc: "黑白電影狗仔隊風格" },

    // ==========================================
    // Group 4: 插畫與動漫 (Illustration & Anime)
    // ==========================================
    { category: "Illustration", name: "日系角色", prompt: "High quality anime character illustration of [主體], Makoto Shinkai style, vibrant colors, highly detailed background, beautiful lighting, emotive expression.", desc: "新海誠光影風" },
    { category: "Illustration", name: "吉卜力", prompt: "Studio Ghibli style anime art of [主體], hand painted background, lush greenery, peaceful atmosphere, hayao miyazaki style, vibrant colors.", desc: "宮崎駿手繪風" },
    { category: "Illustration", name: "奇幻插畫", prompt: "Epic fantasy digital painting of [主體], magical atmosphere, glowing effects, intricate details, dynamic composition, artstation trending.", desc: "史詩奇幻場景" },
    { category: "Illustration", name: "賽博龐克", prompt: "Futuristic cyberpunk city street with [主體], neon lights, rain, reflections, high tech, dystopian atmosphere, cinematic.", desc: "未來科幻風格" },
    { category: "Illustration", name: "蒸氣龐克", prompt: "Steampunk style illustration of [主體], brass gears, copper pipes, victorian fashion, steam engine aesthetic, intricate mechanical details.", desc: "機械復古美學" },
    { category: "Illustration", name: "童書插畫", prompt: "Whimsical children's book illustration of [主體], watercolor style, soft pastel colors, cute characters, magical atmosphere.", desc: "溫馨童趣繪本" },
    { category: "Illustration", name: "復古海報", prompt: "Retro vintage travel poster of [主體], grainy texture, muted colors, bold typography, mid-century modern style, vector illustration.", desc: "復古旅遊海報" },
    { category: "Illustration", name: "球鞋設計", prompt: "Futuristic sneaker design of [主體], side view, dynamic shape, mesh and leather texture, floating in air, hypebeast style.", desc: "潮鞋概念設計" },
    { category: "Illustration", name: "像素藝術", prompt: "Pixel art of [主體], 16-bit retro game style, detailed sprites, vibrant colors, nostalgic aesthetic.", desc: "復古遊戲點陣" },
    { category: "Illustration", name: "時尚手繪", prompt: "Fashion illustration sketch of [主體], watercolor and ink, stylish, elegant pose, haute couture, exaggerated proportions.", desc: "時尚服裝草圖" },

    // ==========================================
    // Group 5: 傳統藝術與特殊材質 (Fine Art & Crafts)
    // ==========================================
    { category: "Fine Art", name: "印象派", prompt: "Oil painting of [主體] in Claude Monet style, impressionism, visible brush strokes, dappled light, vibrant colors, plein air.", desc: "莫內光影油畫" },
    { category: "Fine Art", name: "水墨山水", prompt: "Traditional Chinese ink wash painting of [主體], sumi-e style, black and white, negative space, artistic brush strokes.", desc: "中國水墨畫" },
    { category: "Fine Art", name: "浮世繪", prompt: "Traditional Japanese ukiyo-e woodblock print of [主體], Katsushika Hokusai style, flat perspective, textured paper, outlined.", desc: "日式版畫風格" },
    { category: "Fine Art", name: "超現實", prompt: "Surrealist painting of [主體] in Salvador Dali style, dreamlike atmosphere, melting objects, impossible geometry, desert landscape.", desc: "達利夢境風格" },
    { category: "Fine Art", name: "大理石雕像", prompt: "Classical marble statue of [主體], greek sculpture style, smooth stone texture, museum lighting, elegant pose.", desc: "古典大理石雕塑" },
    { category: "Fine Art", name: "摺紙藝術", prompt: "Intricate origami art of [主體], made of folded paper, sharp creases, paper texture, studio lighting, minimal background.", desc: "幾何摺紙藝術" },
    { category: "Fine Art", name: "剪紙藝術", prompt: "Layered paper cutout art of [主體], 3d depth, shadow box effect, soft lighting, pastel colors, intricate paper craft.", desc: "紙雕光影層次" },
    { category: "Fine Art", name: "彩繪玻璃", prompt: "Stained glass window design of [主體], vibrant translucent colors, intricate lead lines, light passing through, cathedral atmosphere.", desc: "教堂花窗風格" },
    { category: "Fine Art", name: "街頭塗鴉", prompt: "Vibrant street art graffiti of [主體] on a brick wall, spray paint texture, drips, tags, urban style, bold colors.", desc: "街頭噴漆藝術" },
    { category: "Fine Art", name: "刺青設計", prompt: "Blackwork tattoo design of [主體], clean lines, stippling shading, white background, high contrast, minimalist ink style.", desc: "刺青黑白線稿" },
    { category: "Fine Art", name: "素描", prompt: "Charcoal pencil sketch of [主體] on textured paper, artistic shading, rough lines, expressive, monochrome.", desc: "炭筆手繪素描" },
    { category: "Fine Art", name: "植物圖鑑", prompt: "Vintage botanical illustration of [主體], scientific drawing, aged paper background, detailed line work, watercolor wash.", desc: "復古科學圖鑑" },
    { category: "Fine Art", name: "藍圖", prompt: "Engineering blueprint of [主體], white lines on blue background, technical measurements, schematic style, detailed.", desc: "工程設計藍圖" },
    { category: "Fine Art", name: "塔羅牌", prompt: "Mystical tarot card design of [主體], art nouveau style, intricate golden borders, symbolism, highly detailed illustration.", desc: "新藝術塔羅風" },
    { category: "Fine Art", name: "著色本", prompt: "Black and white coloring book page of [主體], thick clean lines, no shading, simple shapes, white background, for kids.", desc: "兒童著色線稿" },

    // ==========================================
    // Group 6: 背景、紋理與特殊效果 (Textures & FX)
    // ==========================================
    { category: "Texture & FX", name: "無縫紋理", prompt: "Seamless pattern design featuring [主體], repeating motif, fabric print style, vector illustration, flat colors.", desc: "布料背景底紋" },
    { category: "Texture & FX", name: "雙重曝光", prompt: "Double exposure art of [主體], silhouette blended with nature landscape, artistic, dreamy, high contrast, surreal.", desc: "人像與風景疊合" },
    { category: "Texture & FX", name: "流體藝術", prompt: "Abstract fluid art featuring colors of [主體], swirling acrylic paint, macro shot, cells, marble texture, vibrant colors.", desc: "壓克力流動畫" },
    { category: "Texture & FX", name: "暗黑哥德", prompt: "Eldritch horror style art of [主體], H.P. Lovecraft style, dark, gloomy, tentacles, mysterious fog, insanity.", desc: "克蘇魯暗黑風" },
];

const TEMPLATE_CATEGORIES: TemplateCategory[] = ["Commercial", "3D Art", "Photography", "Illustration", "Fine Art", "Texture & FX"];

export default function PromptForm({ onSuccess, initialData }: PromptFormProps) {
    const [loading, setLoading] = useState(false);
    const [showApiSettings, setShowApiSettings] = useState(false);
    const [useMagicEnhancer, setUseMagicEnhancer] = useState(false);

    // Template Selector State
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>("Commercial");

    const [imageCount, setImageCount] = useState(1);
    const [imageEngine, setImageEngine] = useState<'flash' | 'pro' | 'imagen'>("flash");
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Character DNA State
    const [savedCharacters, setSavedCharacters] = useState<{ name: string, prompt: string }[]>([]);
    const [isCharacterMenuOpen, setIsCharacterMenuOpen] = useState(false);
    const [showCharManager, setShowCharManager] = useState(false);

    // Prompt Queue State (for batch variations)
    const [promptQueue, setPromptQueue] = useState<string[]>([]);

    // Flash Suggest State
    const [suggestion, setSuggestion] = useState("");
    const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Template Usage Statistics
    const [templateStats, setTemplateStats] = useState<Record<string, number>>({});

    // Track template usage
    const trackTemplateUsage = (templateName: string) => {
        const stored = localStorage.getItem('templateStats');
        const stats: Record<string, number> = stored ? JSON.parse(stored) : {};
        stats[templateName] = (stats[templateName] || 0) + 1;
        localStorage.setItem('templateStats', JSON.stringify(stats));
        setTemplateStats(stats);
    };

    // Load saved characters from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('characterDNA');
        if (stored) {
            try {
                setSavedCharacters(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to load characters', e);
            }
        }
        // Load prompt queue
        const queueStr = localStorage.getItem('promptQueue');
        if (queueStr) {
            try {
                setPromptQueue(JSON.parse(queueStr));
            } catch (e) {
                console.error('Failed to load queue', e);
            }
        }

        // Load template stats
        const statsStr = localStorage.getItem('templateStats');
        if (statsStr) {
            try {
                setTemplateStats(JSON.parse(statsStr));
            } catch (e) {
                console.error('Failed to load template stats', e);
            }
        }

        // Listen for localStorage changes (from other components on same page)
        const checkQueue = () => {
            const currentQueueStr = localStorage.getItem('promptQueue');
            if (currentQueueStr) {
                try {
                    const parsedQueue = JSON.parse(currentQueueStr);
                    setPromptQueue(prev => {
                        // Only update if different
                        if (JSON.stringify(prev) !== JSON.stringify(parsedQueue)) {
                            return parsedQueue;
                        }
                        return prev;
                    });
                } catch (e) { }
            } else {
                setPromptQueue(prev => prev.length > 0 ? [] : prev);
            }
        };

        // Check every 500ms for queue updates
        const interval = setInterval(checkQueue, 500);

        return () => clearInterval(interval);
    }, []);

    // Save character DNA
    const saveCharacterDNA = () => {
        if (!formData.prompt.trim()) {
            alert('請先輸入或生成角色描述');
            return;
        }
        const name = prompt('給這個角色取個名字:');
        if (!name) return;

        const newCharacters = [...savedCharacters, { name, prompt: formData.prompt }];
        setSavedCharacters(newCharacters);
        localStorage.setItem('characterDNA', JSON.stringify(newCharacters));
        alert(`角色 「${name}」 已儲存！`);
    };

    // Load character DNA
    const loadCharacterDNA = (characterPrompt: string) => {
        setFormData(prev => ({ ...prev, prompt: characterPrompt + ', [場景描述]' }));
        setIsCharacterMenuOpen(false);
    };

    // Delete character DNA
    const deleteCharacterDNA = (index: number) => {
        if (!confirm('確定要刪除這個角色嗎？')) return;
        const newCharacters = savedCharacters.filter((_, i) => i !== index);
        setSavedCharacters(newCharacters);
        localStorage.setItem('characterDNA', JSON.stringify(newCharacters));
    };

    // Edit character DNA - allow editing both name and description
    const editCharacterDNA = (index: number) => {
        const char = savedCharacters[index];

        // Ask what to edit
        const choice = window.prompt(
            `編輯角色「${char.name}」\n\n輸入選項：\n1 = 只改名稱\n2 = 只改描述\n3 = 兩個都改`,
            "1"
        );

        if (choice === null) return; // cancelled

        let newName = char.name;
        let newPrompt = char.prompt;

        if (choice === "1" || choice === "3") {
            const inputName = window.prompt('修改角色名稱:', char.name);
            if (inputName === null) return;
            newName = inputName || char.name;
        }

        if (choice === "2" || choice === "3") {
            const inputPrompt = window.prompt('修改角色描述:', char.prompt);
            if (inputPrompt === null) return;
            newPrompt = inputPrompt || char.prompt;
        }

        // Update character
        const newCharacters = [...savedCharacters];
        newCharacters[index] = { name: newName, prompt: newPrompt };
        setSavedCharacters(newCharacters);
        localStorage.setItem('characterDNA', JSON.stringify(newCharacters));
    };

    // Preview character DNA - just show, no side effects
    const previewCharacterDNA = (char: { name: string, prompt: string }) => {
        // Use a custom approach to avoid focus issues
        const message = `【${char.name}】\n\n${char.prompt}`;
        window.alert(message);
    };

    // Default State

    // Default State
    const defaultState = {
        prompt: "",
        negativePrompt: "",
        width: 1024,
        height: 1024,
        steps: 25,
        cfgScale: 7.0,
        seed: -1,
        provider: "mock",
        apiUrl: "",
        apiKey: "",
    };

    const [formData, setFormData] = useState(defaultState);

    // Load API key from localStorage on mount
    useEffect(() => {
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) {
            setFormData(prev => ({ ...prev, apiKey: savedApiKey }));
        }
    }, []);

    // Effect to populate form when initialData changes (Redraw action)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                prompt: initialData.prompt,
                negativePrompt: initialData.negativePrompt || "",
                width: initialData.width,
                height: initialData.height,
                steps: initialData.steps || 25,
                cfgScale: initialData.cfgScale || 7.0,
                seed: initialData.seed || -1,
                // Keep provider settings as is
            }));

            // Smart Magic Detection (Updated for Ultimate Logic v2)
            if (initialData.prompt.includes(LOGIC_PREFIX.trim()) || initialData.prompt.includes("Analyze the core emotion")) {
                setUseMagicEnhancer(true);

                // Aggressively strip known components to return to clean user prompt
                let cleanPrompt = initialData.prompt
                    .replace(LOGIC_PREFIX, "")
                    .replace(QUALITY_SUFFIX_BASE, "")
                    .trim();

                // Strip all scene profiles (lens, lighting, style)
                for (const profile of Object.values(SCENE_PROFILES)) {
                    cleanPrompt = cleanPrompt
                        .replace(profile.lens, "")
                        .replace(profile.lighting, "")
                        .replace(profile.style, "");
                }

                // Final cleanup of leftover commas/dots
                cleanPrompt = cleanPrompt.replace(/^,/, "").replace(/,$/, "").replace(/,\s*,/g, ",").trim();

                // Fallback regex cleanup for any remnants
                cleanPrompt = cleanPrompt.replace(/Analyze the core emotion[\s\S]*?fidelity\./, "").trim();
                cleanPrompt = cleanPrompt.replace(/Masterpiece[\s\S]*?photography\./, "").trim();
                cleanPrompt = cleanPrompt.replace(/\d+mm[^,]*aperture/gi, "").trim();

                setFormData(prev => ({ ...prev, prompt: cleanPrompt }));
            } else {
                setUseMagicEnhancer(false);
            }

            // Optionally scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [initialData]);

    // ... (Rest of component)

    // ... (Rest of component)

    const [errorMsg, setErrorMsg] = useState("");

    // Download image helper
    const downloadImage = async (imageUrl: string, index: number) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image-${Date.now()}-${index + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    // Save selected image to gallery
    const saveToGallery = async (imageUrl: string) => {
        if (!previewData) return;
        setLoading(true);
        try {
            const res = await fetch("/api/prompts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl,
                    prompt: previewData.prompt,
                    originalPrompt: previewData.originalPrompt,
                    promptZh: previewData.promptZh,
                    negativePrompt: previewData.negativePrompt,
                    width: previewData.width,
                    height: previewData.height,
                    seed: previewData.seed,
                    cfgScale: previewData.cfgScale,
                    steps: previewData.steps,
                    tags: previewData.tags
                }),
            });
            if (!res.ok) throw new Error("Failed to save");
            setIsPreviewMode(false);
            setPreviewImages([]);
            setPreviewData(null);
            onSuccess();
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Cancel preview mode
    const cancelPreview = () => {
        setIsPreviewMode(false);
        setPreviewImages([]);
        setPreviewData(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        try {
            const payload = {
                ...formData,
                prompt: useMagicEnhancer
                    ? applyUltimateMasterFilter(formData.prompt, imageEngine)
                    : formData.prompt,
                imageCount: imageEngine === "imagen" ? imageCount : 1,
                imageEngine,
                previewMode: imageEngine === "imagen" && imageCount > 1
            };

            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(await res.text() || "Generation Failed");
            }

            const data = await res.json();

            // Check if preview mode response
            if (data.previewMode && data.images?.length > 0) {
                setPreviewImages(data.images);
                setPreviewData(data);
                setIsPreviewMode(true);
            } else {
                // Single image, directly saved
                onSuccess();
            }
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        // Save API key to localStorage for use by Gallery features
        if (name === 'apiKey') {
            localStorage.setItem('geminiApiKey', value);
        }

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "width" ||
                    name === "height" ||
                    name === "steps" ||
                    name === "cfgScale" ||
                    name === "seed"
                    ? Number(value)
                    : value,
        }));

        // Flash Suggest Logic
        if (name === "prompt") {
            setSuggestion(""); // Clear old suggestion immediately
            if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);

            if (value.length >= 5) {
                suggestionTimeoutRef.current = setTimeout(async () => {
                    try {
                        const res = await fetch("/api/suggest", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ prompt: value, apiKey: formData.apiKey })
                        });
                        const data = await res.json();
                        if (data.suggestion) {
                            setSuggestion(data.suggestion);
                        }
                    } catch (e) {
                        console.error("Flash Suggest Error:", e);
                    }
                }, 800); // 800ms debounce
            }
        }
    };

    const handleRatioSelect = (width: number, height: number) => {
        setFormData((prev) => ({ ...prev, width, height }));
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-4xl bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-6"
        >
            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm animate-in fade-in">
                    ❌ 錯誤: {errorMsg}
                </div>
            )}

            {/* Settings Toggle */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">AI 服務商</label>
                    <select
                        name="provider"
                        value={formData.provider}
                        onChange={handleChange}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                        {PROVIDERS.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={() => setShowApiSettings(!showApiSettings)}
                    className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                    {showApiSettings ? "隐藏設定" : "API 設定"}
                    <svg className={`w-4 h-4 transition-transform ${showApiSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* API Settings */}
            {showApiSettings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-xl border border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
                    {formData.provider === "sd" && (
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">API 網址 (URL)</label>
                            <input
                                type="text"
                                name="apiUrl"
                                value={formData.apiUrl}
                                onChange={handleChange}
                                placeholder="e.g., http://127.0.0.1:7860"
                                className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-white"
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">API 金鑰 (Key)</label>
                        <input
                            type="password"
                            name="apiKey"
                            value={formData.apiKey}
                            onChange={handleChange}
                            placeholder={formData.provider === "gemini" ? "Required for Gemini" : "Optional"}
                            className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-white"
                        />
                    </div>
                    {formData.provider === "gemini" && (
                        <div className="col-span-full text-xs text-blue-300 bg-blue-500/10 p-2 rounded">
                            提示：使用 Google Imagen 3 模型生成真實圖片。請確保您的 API Key 具有權限。
                        </div>
                    )}
                </div>
            )}

            {/* Template Selector */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                <button
                    type="button"
                    onClick={() => setIsTemplateOpen(!isTemplateOpen)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="text-sm font-medium text-purple-200">📚 選擇風格模板</span>
                        <span className="text-xs text-gray-500">({PROMPT_TEMPLATES.length} 款)</span>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isTemplateOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isTemplateOpen && (
                    <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        {/* Category Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATE_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeCategory === cat
                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Template Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                            {PROMPT_TEMPLATES.filter(t => t.category === activeCategory).map((template, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, prompt: template.prompt }));
                                        trackTemplateUsage(template.name);
                                        setIsTemplateOpen(false);
                                    }}
                                    className="group p-3 bg-white/5 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/50 rounded-lg text-left transition-all relative"
                                >
                                    {templateStats[template.name] && (
                                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {templateStats[template.name]}
                                        </span>
                                    )}
                                    <div className="text-sm font-medium text-white group-hover:text-purple-200 truncate">
                                        {template.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 group-hover:text-purple-300 truncate mt-0.5">
                                        {template.desc}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="text-[10px] text-gray-500 text-center pt-1">
                            💡 點擊模板後，請將 <span className="text-amber-400 font-mono">[主體]</span> 替換成您想要的內容
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex flex-wrap justify-between items-center gap-2">
                    <label className="text-xs md:text-sm font-medium text-purple-200">正向提示詞 (Prompt)</label>
                    <button
                        type="button"
                        onClick={() => setUseMagicEnhancer(!useMagicEnhancer)}
                        className={`text-xs flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${useMagicEnhancer
                            ? "bg-amber-400 text-black border-amber-400 font-bold shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={useMagicEnhancer ? "currentColor" : "none"} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {useMagicEnhancer ? "✨ 優化包已啟用" : "優化通用包"}
                    </button>

                    {/* AI Enhance Button */}
                    <button
                        type="button"
                        disabled={loading || !formData.prompt.trim()}
                        onClick={async () => {
                            if (!formData.prompt.trim()) return;
                            setLoading(true);
                            try {
                                const res = await fetch("/api/enhance", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        prompt: formData.prompt,
                                        apiKey: formData.apiKey
                                    }),
                                });
                                if (!res.ok) throw new Error(await res.text());
                                const data = await res.json();
                                if (data.enhanced) {
                                    setFormData(prev => ({ ...prev, prompt: data.enhanced }));
                                }
                            } catch (err: any) {
                                setErrorMsg(err.message || "AI 優化失敗");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="text-xs flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-200 border-pink-500/30 hover:from-pink-500 hover:to-purple-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        title="AI 幫您擴寫成專業 Prompt"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI 擴寫
                    </button>

                    {/* Chinese to English Translation Button */}
                    <button
                        type="button"
                        disabled={loading || !formData.prompt.trim()}
                        onClick={async () => {
                            if (!formData.prompt.trim()) return;
                            setLoading(true);
                            try {
                                const res = await fetch("/api/translate", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        text: formData.prompt,
                                        apiKey: formData.apiKey
                                    }),
                                });
                                if (!res.ok) throw new Error(await res.text());
                                const data = await res.json();
                                if (data.translated) {
                                    setFormData(prev => ({ ...prev, prompt: data.translated }));
                                }
                            } catch (err: any) {
                                setErrorMsg(err.message || "翻譯失敗");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className="text-xs flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border-blue-500/30 hover:from-blue-500 hover:to-cyan-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        title="中文轉英文 Prompt"
                    >
                        🇨🇳→🇺🇸
                    </button>

                    {/* Queue Buttons - shows when there are queued prompts */}
                    {promptQueue.length > 0 && (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    const [nextPrompt, ...rest] = promptQueue;
                                    if (nextPrompt) {
                                        setFormData(prev => ({ ...prev, prompt: nextPrompt }));
                                        setPromptQueue(rest);
                                        localStorage.setItem('promptQueue', JSON.stringify(rest));
                                    }
                                }}
                                className="text-xs flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-200 border-orange-500/30 hover:from-orange-500 hover:to-amber-500 hover:text-white animate-pulse"
                                title="載入佇列中的下一個 Prompt"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                📋 下一個 ({promptQueue.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setPromptQueue([]);
                                    localStorage.removeItem('promptQueue');
                                }}
                                className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-full border transition-all bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500 hover:text-white"
                                title="清除佇列"
                            >
                                ✕
                            </button>
                        </>
                    )}

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsCharacterMenuOpen(!isCharacterMenuOpen)}
                            className={`text-xs flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${savedCharacters.length > 0 || isCharacterMenuOpen
                                ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/50"
                                : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
                                }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            角色庫 {savedCharacters.length > 0 && `(${savedCharacters.length})`}
                        </button>

                        {isCharacterMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setIsCharacterMenuOpen(false)} />
                                <div className="absolute top-10 right-0 z-30 w-72 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
                                        <span className="text-xs text-gray-400">已儲存的角色 DNA</span>
                                        <button
                                            onClick={saveCharacterDNA}
                                            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                                        >
                                            + 儲存目前
                                        </button>
                                    </div>
                                    {savedCharacters.length > 0 ? (
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {savedCharacters.map((char, idx) => (
                                                <div key={idx} className="flex items-center gap-1 group">
                                                    <button
                                                        onClick={() => loadCharacterDNA(char.prompt)}
                                                        className="flex-1 text-left px-3 py-2 bg-white/5 hover:bg-cyan-500/20 rounded-lg text-sm text-white transition-colors truncate"
                                                        title="點擊套用此角色"
                                                    >
                                                        {char.name}
                                                    </button>
                                                    {/* Preview Button */}
                                                    <button
                                                        onClick={() => previewCharacterDNA(char)}
                                                        className="p-1.5 text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded transition-all opacity-0 group-hover:opacity-100"
                                                        title="預覽角色描述"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => editCharacterDNA(idx)}
                                                        className="p-1.5 text-gray-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded transition-all opacity-0 group-hover:opacity-100"
                                                        title="編輯角色"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => deleteCharacterDNA(idx)}
                                                        className="p-1.5 text-gray-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all opacity-0 group-hover:opacity-100"
                                                        title="刪除此角色"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 text-xs py-4">
                                            尚無儲存的角色<br />
                                            <span className="text-cyan-400">點擊下方「🧑 提取角色」上傳圖片</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Magic Reverse Prompt Area */}
                <div className="space-y-3">
                    <div className="relative group">
                        {/* Shadow suggestion layer */}
                        {suggestion && (
                            <div
                                className="absolute inset-0 p-4 pt-[17px] pointer-events-none text-white/20 whitespace-pre-wrap break-words text-sm overflow-hidden"
                                aria-hidden="true"
                            >
                                <span className="invisible">{formData.prompt}</span>
                                <span>{suggestion}</span>
                                <span className="ml-2 inline-flex items-center text-[10px] bg-white/10 px-1 rounded animate-pulse">Tab to accept</span>
                            </div>
                        )}
                        <textarea
                            name="prompt"
                            required
                            rows={4}
                            value={formData.prompt}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab' && suggestion) {
                                    e.preventDefault();
                                    setFormData(prev => ({ ...prev, prompt: prev.prompt + suggestion }));
                                    setSuggestion("");
                                }
                            }}
                            placeholder="描述您想生成的畫面..."
                            className="w-full bg-black/40 border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none relative z-10"
                        />
                    </div>

                    {/* 工具列遷移至外部右下角，確保按鈕獨立且佈局清晰 */}
                    <div className="flex justify-end items-center gap-1.5 px-1 py-1">
                        <input
                            type="file"
                            id="magic-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                    alert("圖片太大，請小於 5MB");
                                    return;
                                }
                                e.target.value = "";
                                setLoading(true);
                                try {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                        const base64 = reader.result as string;
                                        const res = await fetch("/api/describe", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                image: base64,
                                                apiKey: formData.apiKey
                                            }),
                                        });
                                        if (!res.ok) throw new Error(await res.text());
                                        const data = await res.json();
                                        if (data.prompt) {
                                            setFormData(prev => ({ ...prev, prompt: data.prompt }));
                                        }
                                    };
                                    reader.readAsDataURL(file);
                                } catch (err: any) {
                                    setErrorMsg(err.message || "圖片分析失敗");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        />
                        <input
                            type="file"
                            id="character-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                    alert("圖片太大，請小於 5MB");
                                    return;
                                }
                                e.target.value = "";
                                setLoading(true);
                                try {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                        const base64 = reader.result as string;
                                        const res = await fetch("/api/describe", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                image: base64,
                                                apiKey: formData.apiKey,
                                                characterOnly: true
                                            }),
                                        });
                                        if (!res.ok) throw new Error(await res.text());
                                        const data = await res.json();
                                        if (data.prompt) {
                                            const name = prompt('給這個角色取個名字:');
                                            if (name) {
                                                const newCharacters = [...savedCharacters, { name, prompt: data.prompt }];
                                                setSavedCharacters(newCharacters);
                                                localStorage.setItem('characterDNA', JSON.stringify(newCharacters));
                                                setFormData(prev => ({ ...prev, prompt: data.prompt + ', [場景描述]' }));
                                                alert(`角色「${name}」已儲存到角色庫！`);
                                            } else {
                                                setFormData(prev => ({ ...prev, prompt: data.prompt }));
                                            }
                                        }
                                    };
                                    reader.readAsDataURL(file);
                                } catch (err: any) {
                                    setErrorMsg(err.message || "角色提取失敗");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        />

                        {/* Clear Button */}
                        {formData.prompt && (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, prompt: '' }))}
                                className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all backdrop-blur-md border border-white/5"
                                title="清空提示詞"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {/* Copy Prompt Button */}
                        {formData.prompt && (
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        if (navigator.clipboard && window.isSecureContext) {
                                            await navigator.clipboard.writeText(formData.prompt);
                                        } else {
                                            const textArea = document.createElement("textarea");
                                            textArea.value = formData.prompt;
                                            textArea.style.position = "fixed";
                                            textArea.style.left = "-999999px";
                                            document.body.appendChild(textArea);
                                            textArea.select();
                                            document.execCommand("copy");
                                            textArea.remove();
                                        }
                                        alert("已複製 Prompt！");
                                    } catch (err) {
                                        alert("複製失敗，請手動選取複製");
                                    }
                                }}
                                className="p-2 bg-white/5 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 rounded-xl transition-all backdrop-blur-md border border-white/5"
                                title="複製 Prompt"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => document.getElementById('magic-upload')?.click()}
                            className="p-2 bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 rounded-xl transition-all backdrop-blur-md border border-white/5 group relative"
                            title="上傳圖片反推 Prompt"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="absolute -top-10 right-0 w-max px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                📤 上傳反推
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => document.getElementById('character-upload')?.click()}
                            className="p-2 bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 rounded-xl transition-all backdrop-blur-md border border-white/5 group relative"
                            title="提取角色 DNA"
                        >
                            <User className="w-4 h-4" />
                            <span className="absolute -top-10 right-0 w-max px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                🧑 提取角色
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowCharManager(true)}
                            className="ml-1 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2 px-3 text-[10px] font-bold"
                            title="角色庫"
                        >
                            <Users className="w-3.5 h-3.5" />
                            角色庫
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-red-200">負向提示詞 (Negative Prompt)</label>
                <textarea
                    name="negativePrompt"
                    rows={2}
                    value={formData.negativePrompt}
                    onChange={handleChange}
                    placeholder="描述您不想看到的元素..."
                    className="w-full bg-black/40 border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                />
            </div>


            <div className="space-y-4">
                <label className="text-xs text-gray-400 block">圖片比例 (Aspect Ratio)</label>
                <div className="grid grid-cols-5 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.label}
                            type="button"
                            onClick={() => handleRatioSelect(ratio.width, ratio.height)}
                            className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${formData.width === ratio.width && formData.height === ratio.height
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {ratio.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Advanced parameters hidden - not used by Google Imagen */}
            {/* These would only be relevant for Stable Diffusion WebUI */}
            {formData.provider === "sd" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">採樣步數 (Steps)</label>
                        <input
                            type="number"
                            name="steps"
                            value={formData.steps}
                            onChange={handleChange}
                            className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-center"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">提示詞相關性 (CFG)</label>
                        <input
                            type="number"
                            name="cfgScale"
                            step="0.1"
                            value={formData.cfgScale}
                            onChange={handleChange}
                            className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-center"
                        />
                    </div>
                    <div className="space-y-1 col-span-2">
                        <label className="text-xs text-gray-400">種子碼 (Seed, -1 為隨機)</label>
                        <input
                            type="number"
                            name="seed"
                            value={formData.seed}
                            onChange={handleChange}
                            className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-center"
                        />
                    </div>
                </div>
            )}

            {/* Image Engine Selector */}
            <div className="space-y-3">
                <label className="text-xs text-gray-400 block font-medium">生圖引擎 (Image Engine)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setImageEngine("flash");
                            setImageCount(1);
                        }}
                        className={`group relative flex flex-col items-center gap-1 py-3 px-3 rounded-xl border transition-all ${imageEngine === "flash"
                            ? "bg-orange-500/10 border-orange-500/50 text-orange-200 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                            }`}
                    >
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                            <span className={imageEngine === 'flash' ? 'text-orange-400' : ''}>⚡</span> Gemini 3 Flash
                        </div>
                        <span className="text-[10px] opacity-60 font-normal">極速生成，適合測試</span>
                        {imageEngine === "flash" && <div className="absolute inset-x-0 -bottom-px h-1 bg-orange-500 rounded-b-xl" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setImageEngine("pro");
                            setImageCount(1);
                        }}
                        className={`group relative flex flex-col items-center gap-1 py-3 px-3 rounded-xl border transition-all ${imageEngine === "pro"
                            ? "bg-purple-500/10 border-purple-500/50 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                            }`}
                    >
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                            <span className={imageEngine === 'pro' ? 'text-purple-400' : ''}>🧠</span> Gemini 3 Pro
                        </div>
                        <span className="text-[10px] opacity-60 font-normal">深度推理，品質最穩</span>
                        {imageEngine === "pro" && <div className="absolute inset-x-0 -bottom-px h-1 bg-purple-500 rounded-b-xl" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setImageEngine("imagen")}
                        className={`group relative flex flex-col items-center gap-1 py-3 px-3 rounded-xl border transition-all ${imageEngine === "imagen"
                            ? "bg-blue-500/10 border-blue-500/50 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                            }`}
                    >
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                            <span className={imageEngine === 'imagen' ? 'text-blue-400' : ''}>🎨</span> Imagen 4.0
                        </div>
                        <span className="text-[10px] opacity-60 font-normal">寫實藝術，商業畫質</span>
                        {imageEngine === "imagen" && <div className="absolute inset-x-0 -bottom-px h-1 bg-blue-500 rounded-b-xl" />}
                    </button>
                </div>
            </div>

            {/* Image Count Selector */}
            <div className={`space-y-2 transition-all duration-300 ${imageEngine !== 'imagen' ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-400 block">生成數量 (Image Count)</label>
                    {imageEngine !== 'imagen' && (
                        <span className="text-[10px] text-amber-500/70 italic">Flash/Pro 目前僅限 1 張</span>
                    )}
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(count => (
                        <button
                            key={count}
                            type="button"
                            disabled={imageEngine !== 'imagen'}
                            onClick={() => setImageCount(count)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${imageCount === count && imageEngine === 'imagen'
                                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {count} 張
                        </button>
                    ))}
                </div>
                {imageCount > 1 && imageEngine === 'imagen' && (
                    <p className="text-[10px] text-amber-400 animate-in fade-in slide-in-from-top-1">
                        💡 多圖模式：生成後可預覽並選擇最滿意的一張存入圖庫
                    </p>
                )}
            </div>

            {/* Preview Mode Overlay */}
            {isPreviewMode && previewImages.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">
                                📸 預覽選擇 (共 {previewImages.length} 張)
                            </h3>
                            <button
                                type="button"
                                onClick={cancelPreview}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕ 關閉
                            </button>
                        </div>

                        <div className={`grid gap-4 ${previewImages.length === 2 ? 'grid-cols-2' : previewImages.length >= 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {previewImages.map((imgUrl, idx) => (
                                <div key={idx} className="group relative bg-black/40 rounded-xl overflow-hidden border border-white/10">
                                    <img
                                        src={imgUrl}
                                        alt={`Preview ${idx + 1}`}
                                        className="w-full aspect-square object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => downloadImage(imgUrl, idx)}
                                            className="flex-1 py-2 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white font-medium transition-all flex items-center justify-center gap-1"
                                        >
                                            ⬇️ 下載
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => saveToGallery(imgUrl)}
                                            disabled={loading}
                                            className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-500 rounded-lg text-sm text-white font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            ✓ 存入圖庫
                                        </button>
                                    </div>
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                        #{idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={cancelPreview}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-gray-300 transition-all"
                            >
                                全部放棄，重新生成
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中...
                    </span>
                ) : (
                    "開始生圖 (Generate)"
                )}
            </button>

            <CharacterManager
                isOpen={showCharManager}
                onClose={() => setShowCharManager(false)}
                onSelect={(char) => {
                    setFormData(prev => ({
                        ...prev,
                        prompt: char.basePrompt + (prev.prompt ? ", " + prev.prompt : ""),
                        seed: (char.seed !== null && char.seed !== -1) ? char.seed : prev.seed
                    }));
                    setShowCharManager(false);
                }}
            />
        </form>
    );
}
