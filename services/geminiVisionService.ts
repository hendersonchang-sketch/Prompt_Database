import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

export interface VisionAnalysisResult {
    success: boolean;
    tags?: string[];
    error?: string;
}

// Use a lightweight vision model
const MODEL_NAME = 'gemini-2.0-flash-exp';

/**
 * Analyze an image using Gemini Vision to generate tags.
 * 
 * @param imageUrl - Local path (relative to pulic) or URL of the image
 * @param apiKey - Optional API key
 */
export async function analyzeImage(imageUrl: string, apiKey?: string): Promise<VisionAnalysisResult> {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
        return { success: false, error: 'API Key is required' };
    }

    try {
        const client = new GoogleGenAI({ apiKey: key });

        // Prepare image data
        let imageData: string;
        let mimeType = 'image/png'; // Default, detection effectively handled by API often

        // Check if it's a local file in public/uploads
        // imageUrl form DB usually like "/uploads/xxx.png"
        if (imageUrl.startsWith('/')) {
            const localPath = path.join(process.cwd(), 'public', imageUrl);
            if (fs.existsSync(localPath)) {
                const buffer = fs.readFileSync(localPath);
                imageData = buffer.toString('base64');
                // Simple mime detection
                if (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg')) mimeType = 'image/jpeg';
                else if (imageUrl.endsWith('.webp')) mimeType = 'image/webp';
            } else {
                return { success: false, error: 'Local file not found' };
            }
        } else {
            // Handle remote URLs if needed (fetch and convert to base64)
            // For this project, we mostly assume local uploads
            // Skip for now or implement fetch if necessary
            return { success: false, error: 'Remote URL analysis not yet implemented' };
        }

        const prompt = `
        Analyze this image and provide 5 to 10 relevant tags.
        Focus on:
        1. Art Style (e.g., Cyberpunk, Oil Painting, Anime)
        2. Visual Content (e.g., Cat, Rain, Neon Lights)
        3. Lighting/Mood (e.g., Dark, Cinematic, Vibrant)

        Output ONLY a comma-separated list of tags in Traditional Chinese (Taiwan).
        Example: 賽博龐克, 霓虹燈, 雨天, 貓, 科幻
        `;

        const response = await client.models.generateContent({
            model: MODEL_NAME,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: imageData,
                                mimeType: mimeType
                            }
                        }
                    ]
                }
            ]
        });

        // Parse response
        // @ts-ignore - SDK types might vary
        const candidate = response.candidates?.[0];
        const textPart = candidate?.content?.parts?.find((p: any) => p.text);
        const text = textPart?.text || '';

        if (!text) {
            return { success: false, error: 'No response from model' };
        }

        // Clean up and parse tags
        const tags = text.split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0);

        return { success: true, tags };

    } catch (error: any) {
        console.error("Vision Analysis Error:", error);
        return { success: false, error: error.message };
    }
}
