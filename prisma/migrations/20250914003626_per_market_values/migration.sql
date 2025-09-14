/*
  Warnings:

  - You are about to drop the column `noEndDate` on the `SubmissionProduct` table. All the data in the column will be lost.
  - You are about to drop the column `noSavings` on the `SubmissionProduct` table. All the data in the column will be lost.
  - You are about to drop the column `offSaleDate` on the `SubmissionProduct` table. All the data in the column will be lost.
  - You are about to drop the column `onSaleDate` on the `SubmissionProduct` table. All the data in the column will be lost.
  - You are about to drop the column `savingsCA` on the `SubmissionProduct` table. All the data in the column will be lost.
  - You are about to drop the column `savingsUS` on the `SubmissionProduct` table. All the data in the column will be lost.
  - You are about to drop the column `uomTitleCA` on the `SubmissionProduct` table. All the data in the column will be lost.
  - You are about to drop the column `uomTitleUS` on the `SubmissionProduct` table. All the data in the column will be lost.
  - You are about to drop the column `uomValueCA` on the `SubmissionProduct` table. All the data in the column will be lost.
  - You are about to drop the column `uomValueUS` on the `SubmissionProduct` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SubmissionProductMarket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "market" TEXT NOT NULL,
    "noSavings" BOOLEAN NOT NULL DEFAULT false,
    "savings" DECIMAL,
    "currency" TEXT,
    "uomValue" TEXT,
    "uomTitle" TEXT,
    "onSaleDate" DATETIME,
    "offSaleDate" DATETIME,
    "noEndDate" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SubmissionProductMarket_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SubmissionProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE UNIQUE INDEX "SubmissionProduct_submissionId_sku_version_key" ON "SubmissionProduct"("submissionId", "sku", "version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SubmissionProductMarket_productId_idx" ON "SubmissionProductMarket"("productId");

-- CreateIndex
CREATE INDEX "SubmissionProductMarket_market_idx" ON "SubmissionProductMarket"("market");

-- CreateIndex
CREATE INDEX "SubmissionProductMarket_onSaleDate_idx" ON "SubmissionProductMarket"("onSaleDate");

-- CreateIndex
CREATE INDEX "SubmissionProductMarket_offSaleDate_idx" ON "SubmissionProductMarket"("offSaleDate");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionProductMarket_productId_market_key" ON "SubmissionProductMarket"("productId", "market");
