-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_PromptEntryToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PromptEntryToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "PromptEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PromptEntryToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CollectionToPromptEntry" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CollectionToPromptEntry_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CollectionToPromptEntry_B_fkey" FOREIGN KEY ("B") REFERENCES "PromptEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "promptZh" TEXT,
    "originalPrompt" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "embedding" TEXT,
    "personaId" TEXT,
    CONSTRAINT "PromptEntry_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "AlchemistPersona" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PromptEntry" ("cfgScale", "createdAt", "embedding", "height", "id", "imageUrl", "isFavorite", "negativePrompt", "originalPrompt", "prompt", "promptZh", "sampler", "seed", "steps", "tags", "width") SELECT "cfgScale", "createdAt", "embedding", "height", "id", "imageUrl", "isFavorite", "negativePrompt", "originalPrompt", "prompt", "promptZh", "sampler", "seed", "steps", "tags", "width" FROM "PromptEntry";
DROP TABLE "PromptEntry";
ALTER TABLE "new_PromptEntry" RENAME TO "PromptEntry";
CREATE INDEX "PromptEntry_isFavorite_idx" ON "PromptEntry"("isFavorite");
CREATE INDEX "PromptEntry_createdAt_idx" ON "PromptEntry"("createdAt");
CREATE INDEX "PromptEntry_personaId_idx" ON "PromptEntry"("personaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_key" ON "Collection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_count_idx" ON "Tag"("count");

-- CreateIndex
CREATE INDEX "Tag_lastUsed_idx" ON "Tag"("lastUsed");

-- CreateIndex
CREATE UNIQUE INDEX "_PromptEntryToTag_AB_unique" ON "_PromptEntryToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PromptEntryToTag_B_index" ON "_PromptEntryToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CollectionToPromptEntry_AB_unique" ON "_CollectionToPromptEntry"("A", "B");

-- CreateIndex
CREATE INDEX "_CollectionToPromptEntry_B_index" ON "_CollectionToPromptEntry"("B");
