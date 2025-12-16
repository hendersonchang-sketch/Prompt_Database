-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PromptEntry" (
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
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PromptEntry" ("cfgScale", "createdAt", "height", "id", "imageUrl", "negativePrompt", "prompt", "sampler", "seed", "steps", "tags", "width") SELECT "cfgScale", "createdAt", "height", "id", "imageUrl", "negativePrompt", "prompt", "sampler", "seed", "steps", "tags", "width" FROM "PromptEntry";
DROP TABLE "PromptEntry";
ALTER TABLE "new_PromptEntry" RENAME TO "PromptEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
