import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { imageBase64, apiKey } = await request.json();

        if (!imageBase64 || !apiKey) {
            return NextResponse.json({ error: 'Missing imageBase64 or apiKey' }, { status: 400 });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash-exp:generateContent?key=${apiKey}`;

        const evaluationPrompt = `你是世界級的圖片評估專家，擁有 20 年以上的藝術評論和商業攝影經驗。請對這張圖片進行全面性的專業評估，以 JSON 格式返回以下詳細分析。所有描述請使用繁體中文：

{
    "overallScore": {
        "total": 85,
        "grade": "A",
        "summary": "一句話總結這張圖片的整體表現（20-30字）"
    },
    "radarScores": {
        "composition": {
            "score": 8,
            "comment": "構圖評價（10-20字）"
        },
        "color": {
            "score": 7,
            "comment": "色彩運用評價"
        },
        "creativity": {
            "score": 9,
            "comment": "創意獨特性評價"
        },
        "technical": {
            "score": 8,
            "comment": "技術品質評價"
        },
        "emotion": {
            "score": 7,
            "comment": "情感傳達力評價"
        }
    },
    "aiDetection": {
        "isAiGenerated": true,
        "confidence": 0.85,
        "indicators": ["檢測到的 AI 生成特徵，如：完美對稱、異常平滑、細節不一致等"],
        "aiTool": "推測使用的 AI 工具（如有跡象）"
    },
    "copyrightRisk": {
        "riskLevel": "low",
        "riskScore": 2,
        "concerns": [
            {
                "type": "類型（如：人臉、商標、名人肖像、建築版權等）",
                "description": "具體描述",
                "severity": "low/medium/high"
            }
        ],
        "recommendation": "版權使用建議"
    },
    "improvementRoadmap": [
        {
            "priority": 1,
            "area": "需改進的領域",
            "current": "目前狀態描述",
            "target": "改進目標",
            "action": "具體的改進 Prompt（英文）",
            "difficulty": "easy/medium/hard",
            "impact": "改進後的預期效果"
        }
    ],
    "competitorAnalysis": {
        "category": "圖片所屬類別（如：商品攝影、人像、風景等）",
        "industryStandard": "該類別的業界標準描述",
        "gapAnalysis": [
            {
                "aspect": "比較面向",
                "currentLevel": "目前水平（1-10）",
                "industryLevel": "業界標準（1-10）",
                "gap": "差距說明"
            }
        ],
        "benchmarkImages": ["推薦參考的風格/攝影師/品牌名稱"]
    },
    "marketValue": {
        "estimatedPrice": {
            "stockPhoto": "圖庫預估價格範圍（USD）",
            "commercial": "商業授權預估價格（USD）",
            "exclusive": "獨家授權預估價格（USD）"
        },
        "suitablePlatforms": ["適合上架的平台，如：Shutterstock、Adobe Stock、Getty Images 等"],
        "demandLevel": "市場需求程度（低/中/高/極高）",
        "competitiveness": "競爭力評估",
        "suggestedKeywords": ["建議的關鍵字標籤，用於圖庫 SEO，10-15 個"]
    },
    "usageScenarios": [
        {
            "scenario": "使用場景（如：社群廣告、電商主圖、網站橫幅等）",
            "suitability": "適合度（1-10）",
            "adjustments": "需要的調整（如有）"
        }
    ],
    "expertComment": {
        "strengths": ["專家認可的優點，3-5 項"],
        "weaknesses": ["需要注意的缺點，2-3 項"],
        "professionalTip": "給創作者的專業建議（2-3 句話）"
    }
}

請只返回 JSON，不要有任何其他文字。確保所有評分在 1-10 之間，百分比在 0-1 之間。`;

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: evaluationPrompt },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
                            }
                        }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.7,
                    maxOutputTokens: 4096
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            return NextResponse.json({ error: 'AI 評估失敗' }, { status: 500 });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from response
        try {
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                const jsonStr = text.substring(start, end + 1);
                const evaluation = JSON.parse(jsonStr);
                return NextResponse.json(evaluation);
            } else {
                throw new Error('No JSON found');
            }
        } catch (parseErr) {
            console.error('JSON Parse Error:', parseErr, 'Raw:', text);
            return NextResponse.json({ error: '解析結果失敗', raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Comprehensive Evaluation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
