
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const latest = await prisma.promptEntry.findMany({
        take: 5,
        orderBy: {
            createdAt: 'desc'
        },
        select: {
            id: true,
            createdAt: true,
            imageUrl: true,
            prompt: true
        }
    });

    console.log("Top 5 Latest Records:");
    console.log(JSON.stringify(latest, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
