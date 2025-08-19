/*
  Warnings:

  - Added the required column `updatedAt` to the `SubmissionProduct` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requester" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Submission" ("createdAt", "id", "note", "requester") SELECT "createdAt", "id", "note", "requester" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");
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
    "savingsUS" TEXT,
    "savingsCA" TEXT,
    "uomTitleUS" TEXT,
    "uomValueUS" TEXT,
    "uomTitleCA" TEXT,
    "uomValueCA" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubmissionProduct_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionProduct" ("id", "longDescription", "offSaleDate", "offSaleMessage", "onSaleDate", "productName", "savingsCA", "savingsUS", "shortDescription", "sku", "stamp", "submissionId", "uomTitleCA", "uomTitleUS", "uomValueCA", "uomValueUS") SELECT "id", "longDescription", "offSaleDate", "offSaleMessage", "onSaleDate", "productName", "savingsCA", "savingsUS", "shortDescription", "sku", "stamp", "submissionId", "uomTitleCA", "uomTitleUS", "uomValueCA", "uomValueUS" FROM "SubmissionProduct";
DROP TABLE "SubmissionProduct";
ALTER TABLE "new_SubmissionProduct" RENAME TO "SubmissionProduct";
CREATE INDEX "SubmissionProduct_submissionId_idx" ON "SubmissionProduct"("submissionId");
CREATE INDEX "SubmissionProduct_sku_idx" ON "SubmissionProduct"("sku");
CREATE UNIQUE INDEX "SubmissionProduct_submissionId_sku_key" ON "SubmissionProduct"("submissionId", "sku");
CREATE TABLE "new_SubmissionProductAccessory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "accessorySku" TEXT,
    "accessoryLabel" TEXT,
    CONSTRAINT "SubmissionProductAccessory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SubmissionProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionProductAccessory" ("accessoryLabel", "accessorySku", "id", "productId") SELECT "accessoryLabel", "accessorySku", "id", "productId" FROM "SubmissionProductAccessory";
DROP TABLE "SubmissionProductAccessory";
ALTER TABLE "new_SubmissionProductAccessory" RENAME TO "SubmissionProductAccessory";
CREATE INDEX "SubmissionProductAccessory_productId_idx" ON "SubmissionProductAccessory"("productId");
CREATE TABLE "new_SubmissionProductCulture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "cultureCode" TEXT NOT NULL,
    "translatedName" TEXT,
    "translatedShort" TEXT,
    "translatedLong" TEXT,
    CONSTRAINT "SubmissionProductCulture_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SubmissionProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionProductCulture" ("cultureCode", "id", "productId", "translatedLong", "translatedName", "translatedShort") SELECT "cultureCode", "id", "productId", "translatedLong", "translatedName", "translatedShort" FROM "SubmissionProductCulture";
DROP TABLE "SubmissionProductCulture";
ALTER TABLE "new_SubmissionProductCulture" RENAME TO "SubmissionProductCulture";
CREATE INDEX "SubmissionProductCulture_cultureCode_idx" ON "SubmissionProductCulture"("cultureCode");
CREATE INDEX "SubmissionProductCulture_productId_idx" ON "SubmissionProductCulture"("productId");
CREATE UNIQUE INDEX "SubmissionProductCulture_productId_cultureCode_key" ON "SubmissionProductCulture"("productId", "cultureCode");
CREATE TABLE "new_SubmissionProductRecommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    CONSTRAINT "SubmissionProductRecommendation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SubmissionProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionProductRecommendation" ("id", "productId", "sku") SELECT "id", "productId", "sku" FROM "SubmissionProductRecommendation";
DROP TABLE "SubmissionProductRecommendation";
ALTER TABLE "new_SubmissionProductRecommendation" RENAME TO "SubmissionProductRecommendation";
CREATE INDEX "SubmissionProductRecommendation_productId_idx" ON "SubmissionProductRecommendation"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
