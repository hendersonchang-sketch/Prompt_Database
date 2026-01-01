
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

async function syncGallery() {
    console.log('🔄 Starting Gallery Sync...');

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.error('❌ Uploads directory not found!');
        process.exit(1);
    }

    const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i));
    console.log(`📂 Found ${files.length} images in ${UPLOADS_DIR}`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        const imageUrl = `/uploads/${file}`;

        // Check if exists
        const existing = await prisma.promptEntry.findFirst({
            where: { imageUrl }
        });

        if (existing) {
            skippedCount++;
            continue;
        }

        // Parse Metadata from filename
        // Format: "imagen-1766566806770-0-sppgp.jpg"
        // Regex to capture timestamp
        const match = file.match(/(\d{13})/); // matches 13 digit timestamp
        let createdAt = new Date();
        if (match && match[1]) {
            createdAt = new Date(parseInt(match[1]));
        }

        // Insert
        await prisma.promptEntry.create({
            data: {
                prompt: "System Recovered Image (Missing Metadata)",
                originalPrompt: "Recovered from file system scan",
                imageUrl: imageUrl,
                createdAt: createdAt,
                width: 1024,
                height: 1024,
                sampler: "Unknown",
                cfgScale: 7.0,
                steps: 20
            }
        });

        addedCount++;
        if (addedCount % 50 === 0) process.stdout.write('.');
    }

    console.log(`\n\n✅ Sync Complete`);
    console.log(`   Added: ${addedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
}

syncGallery()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
