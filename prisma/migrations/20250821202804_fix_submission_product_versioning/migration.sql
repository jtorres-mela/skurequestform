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
    "onSaleDate" DATETIME,
    "offSaleDate" DATETIME,
    "noEndDate" BOOLEAN NOT NULL DEFAULT false,
    "savingsUS" TEXT,
    "savingsCA" TEXT,
    "noSavings" BOOLEAN NOT NULL DEFAULT false,
    "isPdpRequested" BOOLEAN NOT NULL DEFAULT false,
    "pdpWorkRequest" TEXT,
    "uomTitleUS" TEXT,
    "uomValueUS" TEXT,
    "uomTitleCA" TEXT,
    "uomValueCA" TEXT,
    "includeTranslations" BOOLEAN NOT NULL DEFAULT false,
    "requestedCulturesJson" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubmissionProduct_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionProduct" ("createdAt", "id", "includeTranslations", "isPdpRequested", "longDescription", "noEndDate", "noSavings", "offSaleDate", "offSaleMessage", "onSaleDate", "pdpWorkRequest", "productName", "requestedCulturesJson", "savingsCA", "savingsUS", "shortDescription", "sku", "stamp", "submissionId", "uomTitleCA", "uomTitleUS", "uomValueCA", "uomValueUS", "updatedAt") SELECT "createdAt", "id", "includeTranslations", "isPdpRequested", "longDescription", "noEndDate", "noSavings", "offSaleDate", "offSaleMessage", "onSaleDate", "pdpWorkRequest", "productName", "requestedCulturesJson", "savingsCA", "savingsUS", "shortDescription", "sku", "stamp", "submissionId", "uomTitleCA", "uomTitleUS", "uomValueCA", "uomValueUS", "updatedAt" FROM "SubmissionProduct";
DROP TABLE "SubmissionProduct";
ALTER TABLE "new_SubmissionProduct" RENAME TO "SubmissionProduct";
CREATE INDEX "SubmissionProduct_submissionId_idx" ON "SubmissionProduct"("submissionId");
CREATE INDEX "SubmissionProduct_sku_idx" ON "SubmissionProduct"("sku");
CREATE UNIQUE INDEX "SubmissionProduct_submissionId_sku_version_key" ON "SubmissionProduct"("submissionId", "sku", "version");
CREATE UNIQUE INDEX "SubmissionProduct_submissionId_sku_isCurrent_key" ON "SubmissionProduct"("submissionId", "sku", "isCurrent");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
