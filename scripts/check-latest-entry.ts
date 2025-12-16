
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const latest = await prisma.promptEntry.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, prompt: true, promptZh: true, originalPrompt: true, tags: true }
    });
    console.log("Latest Entry:", latest);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
