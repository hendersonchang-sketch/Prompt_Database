-- CreateTable
CREATE TABLE "PromptEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "imageUrl" TEXT,
    "width" INTEGER NOT NULL DEFAULT 1024,
    "height" INTEGER NOT NULL DEFAULT 1024,
    "sampler" TEXT DEFAULT 'Euler a',
    "seed" INTEGER DEFAULT -1,
    "cfgScale" REAL DEFAULT 7.0,
    "steps" INTEGER DEFAULT 25,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
