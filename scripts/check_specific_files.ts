
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const filenames = [
        "gemini-native-1767337817918-14p2r.jpg",
        "gemini-native-1767337865872-ju2psf.jpg"
    ];

    // Construct like '%filename%'
    const records = await prisma.promptEntry.findMany({
        where: {
            OR: filenames.map(f => ({ imageUrl: { contains: f } }))
        },
        select: {
            id: true,
            createdAt: true,
            imageUrl: true
        }
    });

    console.log("Checking Records for Known Recent Files:");
    records.forEach(r => {
        console.log(`[${r.id}] ${r.imageUrl}`);
        console.log(`    Created At: ${r.createdAt.toISOString()}`);
        console.log(`    Timestamp:  ${r.createdAt.getTime()}`);
    });

    if (records.length === 0) {
        console.log("WARNING: These files exist on disk but were NOT found in DB search by filename!");
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
