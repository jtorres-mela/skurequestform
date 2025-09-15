-- CreateTable
CREATE TABLE "PromotionCouponRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "couponCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PromotionCouponRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromotionCouponCulture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "couponId" INTEGER NOT NULL,
    "cultureCode" TEXT NOT NULL,
    "name" TEXT,
    "shortDescription" TEXT,
    "savingsAmount" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionCouponCulture_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "PromotionCouponRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PromotionCouponRequest_requestId_idx" ON "PromotionCouponRequest"("requestId");

-- CreateIndex
CREATE INDEX "PromotionCouponRequest_createdAt_idx" ON "PromotionCouponRequest"("createdAt");

-- CreateIndex
CREATE INDEX "PromotionCouponCulture_couponId_idx" ON "PromotionCouponCulture"("couponId");

-- CreateIndex
CREATE INDEX "PromotionCouponCulture_cultureCode_idx" ON "PromotionCouponCulture"("cultureCode");
