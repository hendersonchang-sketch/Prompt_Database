
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database image consistency check [DELETION MODE]...");

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

    const missingIds: string[] = [];

    for (const p of prompts) {
        if (!p.imageUrl) continue;

        // Handle leading slash
        const relativePath = p.imageUrl.startsWith('/') ? p.imageUrl.slice(1) : p.imageUrl;
        // Construct full system path
        const fullPath = path.join(process.cwd(), 'public', relativePath);

        if (!fs.existsSync(fullPath)) {
            // Also check if it might be just missing the leading slash in the DB but file exists in uploads?
            // Usually imageUrl is like /uploads/foo.png. 
            // process.cwd()/public/uploads/foo.png should exist.

            console.log(`Missing file for ID ${p.id}: ${p.imageUrl}`);
            missingIds.push(p.id);
        }
    }

    console.log(`\nFound ${missingIds.length} missing files.`);

    if (missingIds.length > 0) {
        console.log("Deleting broken records...");
        const deleted = await prisma.promptEntry.deleteMany({
            where: {
                id: {
                    in: missingIds
                }
            }
        });
        console.log(`\nSUCCESS: Deleted ${deleted.count} records with missing image files.`);
    } else {
        console.log("Database is consistent. No broken records found.");
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
