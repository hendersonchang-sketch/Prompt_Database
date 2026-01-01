
import { PrismaClient } from '@prisma/client';

// Use a separate connection string for the restored DB
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "file:../prisma/dev_git_restore.db"
        }
    }
});

async function main() {
    try {
        const promptCount = await prisma.promptEntry.count();
        console.log(`RESTORED DB PromptEntry Count: ${promptCount}`);
    } catch (e) {
        console.error("Error reading restored DB:", e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
