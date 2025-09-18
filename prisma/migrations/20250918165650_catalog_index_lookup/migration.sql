-- CreateTable
CREATE TABLE "CatalogIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "imageId" TEXT,
    "imagePath" TEXT,
    "productTitle" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogIndex_sku_key" ON "CatalogIndex"("sku");

-- CreateIndex
CREATE INDEX "CatalogIndex_productTitle_idx" ON "CatalogIndex"("productTitle");
