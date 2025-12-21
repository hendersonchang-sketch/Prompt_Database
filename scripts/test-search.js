const fetch = require('node-fetch');

async function testSearch(prompt, useSearch) {
    console.log(`\nTesting with prompt: "${prompt}", useSearch: ${useSearch}`);

    // Replace with your actual local dev URL and a valid API key for testing
    const url = 'http://localhost:3000/api/prompts';
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("Please set GEMINI_API_KEY environment variable.");
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                apiKey: apiKey,
                provider: "gemini",
                imageEngine: "imagen",
                useSearch: useSearch,
                previewMode: true
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("Success!");
            console.log("English Prompt:", data.enPrompt || data.prompt);
            console.log("Chinese Prompt:", data.zhPrompt);
            console.log("Tags:", data.tags);
        } else {
            console.error("Error:", data.error, data.details);
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

// Example calls
// testSearch("latest Ferrari", false);
// testSearch("latest Ferrari", true);
