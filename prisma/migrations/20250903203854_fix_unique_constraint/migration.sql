/*
  Warnings:

  - You are about to drop the column `sku` on the `SubmissionProductRecommendation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SubmissionProductRecommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    CONSTRAINT "SubmissionProductRecommendation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SubmissionProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionProductRecommendation" ("id", "productId") SELECT "id", "productId" FROM "SubmissionProductRecommendation";
DROP TABLE "SubmissionProductRecommendation";
ALTER TABLE "new_SubmissionProductRecommendation" RENAME TO "SubmissionProductRecommendation";
CREATE INDEX "SubmissionProductRecommendation_productId_idx" ON "SubmissionProductRecommendation"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
