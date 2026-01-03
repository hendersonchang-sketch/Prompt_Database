
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const count24 = await prisma.promptEntry.count({
        where: {
            createdAt: {
                gte: twentyFourHoursAgo
            },
            imageUrl: { not: null }
        }
    });

    const count48 = await prisma.promptEntry.count({
        where: {
            createdAt: {
                gte: fortyEightHoursAgo
            },
            imageUrl: { not: null }
        }
    });

    console.log(`Images in last 24h: ${count24}`);
    console.log(`Images in last 48h: ${count48}`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
