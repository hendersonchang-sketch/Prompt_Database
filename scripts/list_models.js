const { GoogleGenAI } = require("@google/genai");
require('dotenv').config({ path: '.env' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in .env");
        return;
    }

    const client = new GoogleGenAI({ apiKey });

    try {
        console.log("Fetching models...");
        const response = await client.models.list();

        console.log("\nAvailable Models:");
        for await (const model of response) {
            // Filter for content generation models
            if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${model.name} (${model.displayName})`);
            }
        }
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
