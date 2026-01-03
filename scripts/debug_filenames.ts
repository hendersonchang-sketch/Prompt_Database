
import fs from 'fs';
import path from 'path';

const searchFor = [
    "gemini-native-1767369025174-2f451ed7.png",
    "gemini-native-1767369101228-208b6ac6.png",
    "gemini-native-1767368980798-47fb9f98.png"
];

const dir = path.join(process.cwd(), 'public', 'uploads');
const files = fs.readdirSync(dir);

console.log(`\n=== CHECKING ${searchFor.length} MISSING FILES ===`);
searchFor.forEach(missing => {
    const exact = files.includes(missing);
    console.log(`[${exact ? 'OK' : 'FAIL'}] ${missing}`);

    // Fuzzy check (maybe extension diff? or timestamp close?)
    if (!exact) {
        const parts = missing.split('-');
        const timestamp = parts[2]; // 1767...
        const similar = files.filter(f => f.includes(timestamp));
        if (similar.length > 0) {
            console.log(`    -> FOUND SIMILAR: ${similar.join(', ')}`);
        } else {
            console.log(`    -> NO SIMILAR FILES FOUND.`);
        }
    }
});
