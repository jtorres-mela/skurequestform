-- CreateTable
CREATE TABLE "PromotionUpload" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionUpload_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "requesterName" TEXT,
    "requesterEmail" TEXT,
    "dueDate" DATETIME,
    "adoId" TEXT,
    "userStory" TEXT,
    "notes" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OPEN_STOCK'
);
INSERT INTO "new_Request" ("adoId", "createdAt", "dueDate", "id", "notes", "requesterEmail", "requesterName", "updatedAt", "userStory") SELECT "adoId", "createdAt", "dueDate", "id", "notes", "requesterEmail", "requesterName", "updatedAt", "userStory" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
CREATE INDEX "Request_type_idx" ON "Request"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PromotionUpload_requestId_idx" ON "PromotionUpload"("requestId");

-- CreateIndex
CREATE INDEX "PromotionUpload_kind_idx" ON "PromotionUpload"("kind");

-- CreateIndex
CREATE INDEX "PromotionUpload_uploadedAt_idx" ON "PromotionUpload"("uploadedAt");
