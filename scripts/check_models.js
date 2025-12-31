const { GoogleGenAI } = require("@google/genai");

// Fetch API Key from env inside the script execution context or ask user to provide it if not set
// Ideally we read .env but for simplicity let's try to grab from process or ask user to paste it.
// For now, let's assume the user runs it like `node scripts/check_models.js YOUR_API_KEY` or we try to read .env
const fs = require('fs');
const path = require('path');

async function main() {
    let apiKey = process.argv[2];

    if (!apiKey) {
        // Try to read from .env in root
        try {
            const envPath = path.join(__dirname, '..', '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/GEMINI_API_KEY=(.*)/);
                if (match && match[1]) {
                    apiKey = match[1].trim();
                    console.log("Found API Key in .env");
                }
            }
        } catch (e) {
            console.log("Could not read .env");
        }
    }

    if (!apiKey) {
        console.error("Please provide API Key: node scripts/check_models.js <API_KEY>");
        return;
    }

    console.log("Checking models with provided API Key...");
    const client = new GoogleGenAI({ apiKey });

    try {
        const models = await client.models.list();
        console.log("\n✅ Available Models:");
        for await (const model of models) {
            console.log(`- ${model.name} (${model.displayName})`);
            console.log(`  Supported Actions: ${model.supportedGenerationMethods?.join(', ') || 'unknown'}`);
        }
    } catch (e) {
        console.error("❌ Failed to list models:", e.message);
        console.log("Body:", e.toString());
    }
}

main();
