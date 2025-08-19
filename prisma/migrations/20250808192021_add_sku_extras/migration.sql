/*
  Warnings:

  - You are about to drop the column `size` on the `SubmissionProduct` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SubmissionProductRecommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    CONSTRAINT "SubmissionProductRecommendation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SubmissionProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "SubmissionProduct_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionProduct" ("id", "longDescription", "offSaleMessage", "productName", "shortDescription", "sku", "stamp", "submissionId") SELECT "id", "longDescription", "offSaleMessage", "productName", "shortDescription", "sku", "stamp", "submissionId" FROM "SubmissionProduct";
DROP TABLE "SubmissionProduct";
ALTER TABLE "new_SubmissionProduct" RENAME TO "SubmissionProduct";
CREATE INDEX "SubmissionProduct_submissionId_idx" ON "SubmissionProduct"("submissionId");
CREATE INDEX "SubmissionProduct_sku_idx" ON "SubmissionProduct"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SubmissionProductRecommendation_productId_idx" ON "SubmissionProductRecommendation"("productId");
