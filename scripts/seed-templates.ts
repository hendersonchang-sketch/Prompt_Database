
import { PrismaClient } from '@prisma/client';
import { PROMPT_TEMPLATES } from '../lib/prompt-data';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding templates...');

    // Optional: Clear existing templates to avoid duplicates if re-running
    await prisma.promptTemplate.deleteMany({});

    for (let index = 0; index < PROMPT_TEMPLATES.length; index++) {
        const template = PROMPT_TEMPLATES[index];
        const existing = await prisma.promptTemplate.findFirst({
            where: { name: template.name }
        });

        if (!existing) {
            await prisma.promptTemplate.create({
                data: {
                    category: template.category,
                    name: template.name,
                    prompt: template.prompt,
                    desc: template.desc,
                    order: index, // Maintain original order
                },
            });
            console.log(`Created template: ${template.name}`);
        } else {
            // Update existing if needed, or skip
            console.log(`Skipping existing: ${template.name}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
