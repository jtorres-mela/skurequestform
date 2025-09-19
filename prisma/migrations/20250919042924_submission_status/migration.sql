-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SubmissionProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submissionId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "productName" TEXT NOT NULL,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "stamp" TEXT,
    "offSaleMessage" TEXT,
    "isPdpRequested" BOOLEAN NOT NULL DEFAULT false,
    "pdpWorkRequest" TEXT,
    "includeTranslations" BOOLEAN NOT NULL DEFAULT false,
    "requestedCulturesJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "statusNote" TEXT,
    "statusChangedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "smartlingJobUids" JSONB,
    CONSTRAINT "SubmissionProduct_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionProduct" ("createdAt", "id", "includeTranslations", "isCurrent", "isPdpRequested", "longDescription", "offSaleMessage", "pdpWorkRequest", "productName", "requestedCulturesJson", "shortDescription", "sku", "smartlingJobUids", "stamp", "submissionId", "updatedAt", "version") SELECT "createdAt", "id", "includeTranslations", "isCurrent", "isPdpRequested", "longDescription", "offSaleMessage", "pdpWorkRequest", "productName", "requestedCulturesJson", "shortDescription", "sku", "smartlingJobUids", "stamp", "submissionId", "updatedAt", "version" FROM "SubmissionProduct";
DROP TABLE "SubmissionProduct";
ALTER TABLE "new_SubmissionProduct" RENAME TO "SubmissionProduct";
CREATE INDEX "SubmissionProduct_submissionId_idx" ON "SubmissionProduct"("submissionId");
CREATE INDEX "SubmissionProduct_sku_idx" ON "SubmissionProduct"("sku");
CREATE INDEX "SubmissionProduct_status_idx" ON "SubmissionProduct"("status");
CREATE INDEX "SubmissionProduct_statusChangedAt_idx" ON "SubmissionProduct"("statusChangedAt");
CREATE UNIQUE INDEX "SubmissionProduct_submissionId_sku_version_key" ON "SubmissionProduct"("submissionId", "sku", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
