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
export type TemplateCategory = "Commercial" | "3D Art" | "Photography" | "Illustration" | "Fine Art" | "Texture & FX";

export interface PromptTemplate {
    category: TemplateCategory;
    name: string;
    prompt: string;
    desc: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ["Commercial", "3D Art", "Photography", "Illustration", "Fine Art", "Texture & FX"];

export const PROMPT_TEMPLATES: PromptTemplate[] = [
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
