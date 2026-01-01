
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const entries = await prisma.promptEntry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, prompt: true, imageUrl: true, tags: true, personaId: true }
    });
    console.log(JSON.stringify(entries, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
