-- CreateTable
CREATE TABLE "PromotionLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uploadId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "culture" TEXT NOT NULL,
    "productName" TEXT,
    "shortDescription" TEXT,
    "savingsAmount" TEXT,
    "couponCode" TEXT,
    "quantityRaw" TEXT,
    "configurable" TEXT,
    "bomRaw" TEXT,
    "uploadedRow" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionLine_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "PromotionUpload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PromotionLine_uploadId_idx" ON "PromotionLine"("uploadId");

-- CreateIndex
CREATE INDEX "PromotionLine_sku_idx" ON "PromotionLine"("sku");

-- CreateIndex
CREATE INDEX "PromotionLine_culture_idx" ON "PromotionLine"("culture");

-- CreateIndex
CREATE INDEX "PromotionLine_type_idx" ON "PromotionLine"("type");
