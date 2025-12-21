
async function checkGallery() {
    try {
        console.log("Fetching /api/prompts on 3003...");
        const res = await fetch("http://localhost:3003/api/prompts");
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text.substring(0, 500)); // First 500 chars
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

checkGallery();
