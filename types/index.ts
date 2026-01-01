
/**
 * Shared Type Definitions
 */

// Google GenAI Response Types
export interface GenAIPart {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
}

export interface GenAITextPart {
    text: string;
}

export interface GenAIImagePart {
    inlineData: {
        mimeType: string;
        data: string;
    };
}

export interface GenAICandidate {
    content?: {
        parts: GenAIPart[];
    };
    finishReason?: string;
    citationMetadata?: any;
}

export interface GenAIResponse {
    candidates?: GenAICandidate[];
    promptFeedback?: any;
}

// Imagen API Response Types
export interface ImagenPrediction {
    bytesBase64Encoded: string;
    mimeType?: string;
}

export interface ImagenResponse {
    predictions?: ImagenPrediction[];
    error?: {
        code: number;
        message: string;
        status: string;
    };
}

// Internal API Types
export interface ImageGenerationResult {
    previewMode?: boolean;
    images?: string[];
    partialResults?: boolean;
    requestedCount?: number;
    actualCount?: number;
    prompt?: string;
    originalPrompt?: string;
    promptZh?: string;
    tags?: string;
    width?: number;
    height?: number;
    seed?: number;
    cfgScale?: number;
    steps?: number;
    negativePrompt?: string;
    isEnhanced?: boolean;
    usedPrompt?: string;
    error?: string;
}
