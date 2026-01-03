
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const prompt = await prisma.promptEntry.findFirst({
        where: {
            imageUrl: {
                not: null
            }
        },
        select: {
            id: true,
            imageUrl: true,
            prompt: true
        }
    });

    console.log("Sample DB Record:", prompt);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
