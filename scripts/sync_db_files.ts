
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Starting File-to-Database Sync (Recovery Mode)...");

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        console.error("❌ Uploads directory not found!");
        return;
    }

    // 1. Get all files on disk
    const files = fs.readdirSync(uploadDir).filter(f =>
        f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp')
    );
    console.log(`📂 Found ${files.length} images on disk.`);

    // 2. Get all known image URLs from DB
    const dbRecords = await prisma.promptEntry.findMany({
        where: { imageUrl: { not: null } },
        select: { imageUrl: true }
    });

    // Normalize DB paths to filenames for comparison
    const knownFilenames = new Set(dbRecords.map(r => {
        if (!r.imageUrl) return '';
        return path.basename(r.imageUrl);
    }));

    // 3. Find Orphans
    const orphans = files.filter(f => !knownFilenames.has(f));
    console.log(`🔍 Found ${orphans.length} orphan files (images not in DB).`);

    if (orphans.length === 0) {
        console.log("✅ Database is fully synced. No recovery needed.");
        return;
    }

    console.log(`🚀 Recovering ${orphans.length} images...`);

    let recoveredCount = 0;

    for (const filename of orphans) {
        try {
            // Extract metadata from filename if possible
            // Format: gemini-native-1767369025174-2f451ed7.png
            const parts = filename.split('-');
            let timestamp = Date.now();
            let engine = 'unknown';

            // Try to parse timestamp
            const tsStr = parts.find(p => p.length === 13 && !isNaN(Number(p)));
            if (tsStr) {
                timestamp = Number(tsStr);
            } else {
                // Fallback: file stats
                const stat = fs.statSync(path.join(uploadDir, filename));
                timestamp = stat.birthtimeMs || stat.mtimeMs;
            }

            // Guess engine
            if (filename.startsWith('gemini')) engine = 'gemini-native';
            if (filename.startsWith('imagen')) engine = 'imagen';
            if (filename.startsWith('comic')) engine = 'comic-strip';

            await prisma.promptEntry.create({
                data: {
                    prompt: `[Recovered] ${filename}`, // Placeholder prompt
                    imageUrl: `/uploads/${filename}`,
                    width: 1024,
                    height: 1024,
                    createdAt: new Date(timestamp),
                    engine: engine,
                    isFavorite: false,
                    tags: 'recovered'
                }
            });
            recoveredCount++;
            process.stdout.write('.');
        } catch (error) {
            console.error(`\n❌ Failed to recover ${filename}:`, error);
        }
    }

    console.log(`\n🎉 Recovery Complete! Restored ${recoveredCount} images.`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
