import { GoogleGenAI } from "@google/genai";

// 1. 定義介面

export interface InlineImageData {
    data: string;      // Base64 encoded image data
    mimeType: string;  // e.g., "image/png", "image/jpeg"
}

export interface GenerateImageOptions {
    prompt: string;
    engineType: "flash" | "pro" | "imagen";
    images?: InlineImageData[];
    apiKey?: string;
}

export interface GenerateImageResult {
    success: boolean;
    imageBase64?: string;
    error?: string;
    model?: string;
}

/**
 * 2. 核心函數 generateImage
 * 使用最新版 @google/genai SDK 並指定 v1beta 端點。
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const { prompt, engineType, images = [], apiKey } = options;

    // 驗證 API Key
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
        return { success: false, error: "API Key is required" };
    }

    // 模型對照表
    const modelMap = {
        flash: "gemini-3-flash-preview",
        pro: "gemini-3-pro-image-preview",
        imagen: "imagen-4",
    };

    const modelName = modelMap[engineType];

    try {
        // 指定 v1beta 端點
        const genAI = new GoogleGenAI({
            apiKey: key,
            httpOptions: { apiVersion: "v1beta" }
        });

        // 構建內容 Parts
        const parts: any[] = [{ text: prompt }];

        // 如果有圖片，加入到 parts 中
        if (images.length > 0) {
            images.forEach((img) => {
                parts.push({
                    inlineData: {
                        data: img.data.replace(/^data:image\/\w+;base64,/, ""),
                        mimeType: img.mimeType,
                    },
                });
            });
        }

        // Config 配置邏輯
        const generationConfig: any = {
            responseModalities: ["IMAGE"],
        };

        if (engineType === "pro") {
            // pro 模式下，如果 images 長度 > 0，強制設定 thinkingLevel: 'high'
            if (images.length > 0) {
                generationConfig.thinkingLevel = "high";
            }
        } else if (engineType === "flash") {
            // flash 模式下，設定 thinkingLevel: 'low' 以優化速度
            generationConfig.thinkingLevel = "low";
        }
        // imagen 模式下，不設定 thinkingLevel (等同於移除)

        const result = await genAI.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts }],
            config: generationConfig,
        });

        // 解析結果：從 response.candidates[0].content.parts 中尋找 inlineData
        const candidate = result.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

        if (imagePart?.inlineData?.data) {
            return {
                success: true,
                imageBase64: imagePart.inlineData.data,
                model: modelName,
            };
        }

        return {
            success: false,
            error: "No image data found in response",
            model: modelName,
        };
    } catch (error: any) {
        console.error(`[geminiImageService] Error with ${engineType}:`, error);
        return {
            success: false,
            error: error.message || "Unknown error",
            model: modelName,
        };
    }
}

/**
 * 3. 實作快捷方法
 */

export async function generateWithFlash(prompt: string, apiKey?: string): Promise<GenerateImageResult> {
    return generateImage({ prompt, engineType: "flash", apiKey });
}

export async function generateWithPro(
    prompt: string,
    images?: InlineImageData[],
    apiKey?: string
): Promise<GenerateImageResult> {
    return generateImage({ prompt, engineType: "pro", images, apiKey });
}

export async function generateWithImagen(prompt: string, apiKey?: string): Promise<GenerateImageResult> {
    return generateImage({ prompt, engineType: "imagen", apiKey });
}
