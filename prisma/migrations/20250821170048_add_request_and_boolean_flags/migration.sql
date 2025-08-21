-- CreateTable
CREATE TABLE "Request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "requesterName" TEXT,
    "requesterEmail" TEXT,
    "dueDate" DATETIME,
    "adoId" TEXT,
    "userStory" TEXT,
    "notes" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requester" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "requestId" INTEGER,
    CONSTRAINT "Submission_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("createdAt", "id", "note", "requester", "updatedAt") SELECT "createdAt", "id", "note", "requester", "updatedAt" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");
CREATE INDEX "Submission_requestId_idx" ON "Submission"("requestId");
CREATE TABLE "new_SubmissionProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submissionId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
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
INSERT INTO "new_SubmissionProduct" ("createdAt", "id", "longDescription", "offSaleDate", "offSaleMessage", "onSaleDate", "productName", "savingsCA", "savingsUS", "shortDescription", "sku", "stamp", "submissionId", "uomTitleCA", "uomTitleUS", "uomValueCA", "uomValueUS", "updatedAt") SELECT "createdAt", "id", "longDescription", "offSaleDate", "offSaleMessage", "onSaleDate", "productName", "savingsCA", "savingsUS", "shortDescription", "sku", "stamp", "submissionId", "uomTitleCA", "uomTitleUS", "uomValueCA", "uomValueUS", "updatedAt" FROM "SubmissionProduct";
DROP TABLE "SubmissionProduct";
ALTER TABLE "new_SubmissionProduct" RENAME TO "SubmissionProduct";
CREATE INDEX "SubmissionProduct_submissionId_idx" ON "SubmissionProduct"("submissionId");
CREATE INDEX "SubmissionProduct_sku_idx" ON "SubmissionProduct"("sku");
CREATE UNIQUE INDEX "SubmissionProduct_submissionId_sku_key" ON "SubmissionProduct"("submissionId", "sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
