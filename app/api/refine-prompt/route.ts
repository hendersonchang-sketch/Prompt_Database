import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // critique represents the 'improvementRoadmap' or a summary string
        const { originalPrompt, critique, score, apiKey } = body;

        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        if (!originalPrompt) {
            return NextResponse.json({ error: "Original prompt is required" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash-exp" });

        // Construct Critique Context
        let critiqueText = "";
        if (typeof critique === 'string') {
            critiqueText = critique;
        } else if (Array.isArray(critique)) {
            // Assuming critique is the improvementRoadmap array
            critiqueText = critique.map((item: any) =>
                `- Priority ${item.priority}: Improve ${item.area} (${item.target}). Suggestion: ${item.action}`
            ).join("\n");
        } else {
            critiqueText = "General improvement needed.";
        }

        const refinementPrompt = `
        You are an Expert AI Art Prompt Engineer.
        
        Current Prompt: "${originalPrompt}"
        Current Score: ${score}/100
        
        Critique / Areas for Improvement:
        ${critiqueText}
        
        TASK:
        Rewrite the prompt to address the critique and improve the image quality. 
        - Enhance descriptive details.
        - Add artistic style keywords if missing.
        - Fix any conflicting terms.
        - Keep the core subject intact.
        
        OUTPUT ONLY THE NEW PROMPT TEXT. NO EXPLANATION.
        `;

        const result = await model.generateContent(refinementPrompt);
        const newPrompt = result.response.text().trim();

        return NextResponse.json({ newPrompt });

    } catch (error: any) {
        console.error("Refine Prompt API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
