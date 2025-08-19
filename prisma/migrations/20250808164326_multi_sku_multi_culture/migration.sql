/*
  Warnings:

  - You are about to drop the column `email` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Submission` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SubmissionProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submissionId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "size" TEXT,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "stamp" TEXT,
    "offSaleMessage" TEXT,
    CONSTRAINT "SubmissionProduct_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubmissionProductAccessory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "accessorySku" TEXT,
    "accessoryLabel" TEXT,
    CONSTRAINT "SubmissionProductAccessory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SubmissionProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubmissionProductCulture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "cultureCode" TEXT NOT NULL,
    "translatedName" TEXT,
    "translatedShort" TEXT,
    "translatedLong" TEXT,
    CONSTRAINT "SubmissionProductCulture_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SubmissionProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requester" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Submission" ("createdAt", "id") SELECT "createdAt", "id" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SubmissionProduct_submissionId_idx" ON "SubmissionProduct"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionProduct_sku_idx" ON "SubmissionProduct"("sku");

-- CreateIndex
CREATE INDEX "SubmissionProductAccessory_productId_idx" ON "SubmissionProductAccessory"("productId");

-- CreateIndex
CREATE INDEX "SubmissionProductCulture_cultureCode_idx" ON "SubmissionProductCulture"("cultureCode");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionProductCulture_productId_cultureCode_key" ON "SubmissionProductCulture"("productId", "cultureCode");
