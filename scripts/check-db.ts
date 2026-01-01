
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const promptCount = await prisma.promptEntry.count();
    const templateCount = await prisma.promptTemplate.count();
    const personaCount = await prisma.alchemistPersona.count();

    console.log(`PromptEntry (Images): ${promptCount}`);
    console.log(`PromptTemplate: ${templateCount}`);
    console.log(`AlchemistPersona: ${personaCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
