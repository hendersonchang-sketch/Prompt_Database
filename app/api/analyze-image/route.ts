import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { imageBase64, apiKey } = await request.json();

        if (!imageBase64 || !apiKey) {
            return NextResponse.json({ error: 'Missing imageBase64 or apiKey' }, { status: 400 });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const analysisPrompt = `你是專業的圖片分析專家。請詳細分析這張圖片，並以 JSON 格式返回以下資訊。所有描述請使用繁體中文：

{
    "composition": {
        "type": "構圖類型（如：三分法、對稱構圖、引導線、框架構圖、黃金比例、對角線等）",
        "elements": ["主要視覺元素列表"],
        "focusPoint": "視覺焦點位置描述",
        "balance": "畫面平衡度評估",
        "suggestion": "構圖改進建議"
    },
    "style": {
        "artStyle": "藝術風格（如：寫實、卡通、油畫、水彩、極簡、cyberpunk 等）",
        "mood": "整體氛圍/情緒",
        "colorPalette": ["主要顏色列表，用 hex 色碼，5-8個"],
        "lighting": "光線描述",
        "replicatePrompt": "如果要複製這個風格，建議使用的英文 Prompt 關鍵詞（約 30-50 字）"
    },
    "modifications": [
        {
            "area": "需要修改的區域描述（繁體中文）",
            "issue": "從大師級標準來看的問題（繁體中文，如：構圖不夠完美、光線可再優化、細節可加強）",
            "prompt": "MUST BE IN ENGLISH ONLY! Write an English prompt for image generation/editing, using professional terms. Example: 'dramatic rim lighting on face, golden hour glow, enhanced depth of field, cinematic color grading'. DO NOT USE CHINESE."
        }
    ],
    "socialMedia": {
        "title": "適合社群媒體的吸睛標題（10-20字）",
        "caption": "Instagram/Facebook 貼文文案（含 emoji，50-100字）",
        "hashtags": ["建議的 hashtag 列表，不含 # 符號，8-15個"]
    },
    "detailedTags": {
        "subject": ["主體相關標籤"],
        "emotion": ["情緒相關標籤"],
        "scene": ["場景相關標籤"],
        "color": ["顏色相關標籤"],
        "technique": ["技術/風格相關標籤"],
        "usage": ["適用用途標籤，如：商業、社群、印刷"]
    },
    "technicalSpecs": {
        "estimatedResolution": "預估解析度品質（如：高解析度 4K、中等 1080p、低解析度）",
        "noiseLevel": "雜訊程度（低/中/高）",
        "sharpness": "銳利度（低/中/高）",
        "colorDepth": "色彩豐富度（淡/中等/濃郁/過飽和）",
        "dynamicRange": "動態範圍（窄/中等/寬廣）"
    },
    "commercialValue": {
        "score": 7,
        "useCases": ["適合的商業用途，如：社群廣告、產品展示、品牌形象、印刷品等"],
        "targetAudience": "目標受眾描述",
        "uniqueness": "獨特性評估",
        "marketability": "市場潛力簡評"
    },
    "similarTemplates": ["推薦使用的類似風格模板名稱，最多3個，例如：商品廣告、等距微縮 PBR、展示卡"],
    "qualityScore": {
        "overall": 8,
        "composition": 8,
        "clarity": 8,
        "creativity": 8,
        "technicalQuality": 8,
        "comment": "整體評價簡述"
    }
}

請只返回 JSON，不要有任何其他文字。`;


        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: analysisPrompt },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
                            }
                        }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            return NextResponse.json({ error: 'AI 分析失敗' }, { status: 500 });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from response
        try {
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                const jsonStr = text.substring(start, end + 1);
                const analysis = JSON.parse(jsonStr);
                return NextResponse.json(analysis);
            } else {
                throw new Error('No JSON found');
            }
        } catch (parseErr) {
            console.error('JSON Parse Error:', parseErr, 'Raw:', text);
            return NextResponse.json({ error: '解析結果失敗', raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Analyze Image Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
