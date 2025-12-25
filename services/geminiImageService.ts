/**
 * Gemini Image Generation Service
 * 
 * 支援三種引擎類型：
 * - flash: 使用 gemini-3-flash-preview，低思考等級，1:1 比例
 * - pro: 使用 gemini-3-pro-image-preview，高思考等級，支援多圖輸入
 * - imagen: 使用 imagen-4，無思考等級參數
 */

import { GoogleGenAI } from "@google/genai";

// ===== 型別定義 =====
export type EngineType = 'flash' | 'pro' | 'imagen';

export interface InlineImageData {
    data: string;      // Base64 encoded image data
    mimeType: string;  // e.g., "image/png", "image/jpeg"
}

export interface GenerateImageOptions {
    prompt: string;
    engineType: EngineType;
    apiKey?: string;
    images?: InlineImageData[];  // 僅 'pro' 引擎支援多圖輸入
    aspectRatio?: string;        // 可覆寫預設比例
    thinkingLevel?: 'low' | 'high'; // 自定義推理等級
}

export interface GenerateImageResult {
    success: boolean;
    imageBase64?: string;
    error?: string;
    model?: string;
}

// ===== 模型配置 =====
const MODEL_CONFIG = {
    flash: {
        model: 'gemini-2.5-flash-image',
        thinkingLevel: 'low',
        aspectRatio: '1:1',
    },
    pro: {
        model: 'gemini-3-pro-image-preview',
        thinkingLevel: 'high',
        aspectRatio: '1:1',
    },
    imagen: {
        model: 'imagen-4.0-ultra-generate-001',
        aspectRatio: '1:1',
    },
} as const;

/**
 * 使用 Gemini v1beta 端點生成圖片
 * 
 * @param options - 生成選項
 * @returns 包含 Base64 圖片字串的結果
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const { prompt, engineType, apiKey, images = [], aspectRatio, thinkingLevel } = options;

    // 驗證 API Key
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
        return {
            success: false,
            error: 'API Key is required',
        };
    }

    // 驗證 prompt
    if (!prompt || prompt.trim().length === 0) {
        return {
            success: false,
            error: 'Prompt is required',
        };
    }

    // 取得模型配置
    const config = MODEL_CONFIG[engineType];
    if (!config) {
        return {
            success: false,
            error: `Invalid engine type: ${engineType}. Must be one of: flash, pro, imagen`,
        };
    }

    try {
        // 初始化 Google GenAI 客戶端（使用 v1beta 端點）
        const client = new GoogleGenAI({
            apiKey: key,
            httpOptions: {
                apiVersion: 'v1beta'
            }
        });

        // 構建 content parts
        const parts: Array<{ text: string } | { inlineData: InlineImageData }> = [
            { text: prompt }
        ];

        // 'pro' 引擎支援多圖輸入
        if (engineType === 'pro' && images.length > 0) {
            for (const img of images) {
                parts.push({
                    inlineData: {
                        data: img.data.replace(/^data:image\/\w+;base64,/, ''),
                        mimeType: img.mimeType,
                    }
                });
            }
        }

        // 構建生成配置
        const generateConfig: Record<string, unknown> = {
            responseModalities: ['IMAGE'],
            ...(aspectRatio || config.aspectRatio) && {
                aspectRatio: aspectRatio || config.aspectRatio
            }
        };

        // 根據引擎類型設定 thinkingLevel（imagen 排除此參數）
        if (engineType !== 'imagen' && ('thinkingLevel' in config || thinkingLevel)) {
            generateConfig.thinkingLevel = thinkingLevel || (config as any).thinkingLevel;
        }

        // 呼叫 API 生成圖片
        const response = await client.models.generateContent({
            model: config.model,
            contents: [
                {
                    role: 'user',
                    parts: parts,
                }
            ],
            config: generateConfig,
        });

        // 解析回應取得圖片
        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content?.parts) {
            return {
                success: false,
                error: 'No valid response from API',
                model: config.model,
            };
        }

        // 尋找圖片 part
        for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
                return {
                    success: true,
                    imageBase64: part.inlineData.data,
                    model: config.model,
                };
            }
        }

        return {
            success: false,
            error: 'No image data in response',
            model: config.model,
        };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`[geminiImageService] Error with ${engineType}:`, errorMessage);

        return {
            success: false,
            error: errorMessage,
            model: config.model,
        };
    }
}

/**
 * 快捷方法：使用 Flash 引擎生成圖片
 */
export async function generateWithFlash(prompt: string, apiKey?: string): Promise<GenerateImageResult> {
    return generateImage({ prompt, engineType: 'flash', apiKey });
}

/**
 * 快捷方法：使用 Pro 引擎生成圖片（支援多圖輸入）
 */
export async function generateWithPro(
    prompt: string,
    images?: InlineImageData[],
    apiKey?: string
): Promise<GenerateImageResult> {
    return generateImage({ prompt, engineType: 'pro', images, apiKey });
}

/**
 * 快捷方法：使用 Imagen 引擎生成圖片
 */
export async function generateWithImagen(prompt: string, apiKey?: string): Promise<GenerateImageResult> {
    return generateImage({ prompt, engineType: 'imagen', apiKey });
}
