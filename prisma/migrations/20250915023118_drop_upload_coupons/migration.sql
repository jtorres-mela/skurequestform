/*
  Warnings:

  - You are about to drop the `PromotionCouponCulture` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromotionCouponRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `couponCode` on the `PromotionLine` table. All the data in the column will be lost.
  - You are about to drop the column `savingsAmount` on the `PromotionLine` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PromotionCouponCulture_cultureCode_idx";

-- DropIndex
DROP INDEX "PromotionCouponCulture_couponId_idx";

-- DropIndex
DROP INDEX "PromotionCouponRequest_createdAt_idx";

-- DropIndex
DROP INDEX "PromotionCouponRequest_requestId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PromotionCouponCulture";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PromotionCouponRequest";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PromotionLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uploadId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "culture" TEXT NOT NULL,
    "productName" TEXT,
    "shortDescription" TEXT,
    "quantityRaw" TEXT,
    "configurable" TEXT,
    "bomRaw" TEXT,
    "uploadedRow" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionLine_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "PromotionUpload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PromotionLine" ("bomRaw", "configurable", "createdAt", "culture", "id", "productName", "quantityRaw", "shortDescription", "sku", "type", "uploadId", "uploadedRow") SELECT "bomRaw", "configurable", "createdAt", "culture", "id", "productName", "quantityRaw", "shortDescription", "sku", "type", "uploadId", "uploadedRow" FROM "PromotionLine";
DROP TABLE "PromotionLine";
ALTER TABLE "new_PromotionLine" RENAME TO "PromotionLine";
CREATE INDEX "PromotionLine_uploadId_idx" ON "PromotionLine"("uploadId");
CREATE INDEX "PromotionLine_sku_idx" ON "PromotionLine"("sku");
CREATE INDEX "PromotionLine_culture_idx" ON "PromotionLine"("culture");
CREATE INDEX "PromotionLine_type_idx" ON "PromotionLine"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
