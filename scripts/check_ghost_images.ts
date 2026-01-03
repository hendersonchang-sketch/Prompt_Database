
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database image consistency check...");

    // Fetch all prompts with images
    const prompts = await prisma.promptEntry.findMany({
        where: {
            imageUrl: {
                not: null
            }
        },
        select: {
            id: true,
            imageUrl: true
        }
    });

    console.log(`Found ${prompts.length} records with images.`);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const missing: string[] = [];

    for (const p of prompts) {
        if (!p.imageUrl) continue;

        const relativePath = p.imageUrl.startsWith('/') ? p.imageUrl.slice(1) : p.imageUrl;
        const fullPath = path.join(process.cwd(), 'public', relativePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`Missing file for ID ${p.id}: ${fullPath}`);
            missing.push(p.id);
        }
    }

    console.log(`\nFound ${missing.length} missing files.`);

    if (missing.length > 0) {
        /*
        // UNCOMMENT TO DELETE
        const deleted = await prisma.promptEntry.deleteMany({
            where: {
                id: {
                    in: missing
                }
            }
        });
        console.log(`Deleted ${deleted.count} records.`);
        */
        console.log("Run with delete logic enabled to clean up.");
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
