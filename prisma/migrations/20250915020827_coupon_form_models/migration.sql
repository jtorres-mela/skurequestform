-- CreateTable
CREATE TABLE "Coupon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "couponCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Coupon_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CouponCulture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "couponId" INTEGER NOT NULL,
    "cultureCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    CONSTRAINT "CouponCulture_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CouponMarketRow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "couponId" INTEGER NOT NULL,
    "market" TEXT NOT NULL,
    "savings" DECIMAL,
    "currency" TEXT,
    CONSTRAINT "CouponMarketRow_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Coupon_requestId_idx" ON "Coupon"("requestId");

-- CreateIndex
CREATE INDEX "Coupon_couponCode_idx" ON "Coupon"("couponCode");

-- CreateIndex
CREATE INDEX "CouponCulture_cultureCode_idx" ON "CouponCulture"("cultureCode");

-- CreateIndex
CREATE UNIQUE INDEX "CouponCulture_couponId_cultureCode_key" ON "CouponCulture"("couponId", "cultureCode");

-- CreateIndex
CREATE INDEX "CouponMarketRow_market_idx" ON "CouponMarketRow"("market");

-- CreateIndex
CREATE UNIQUE INDEX "CouponMarketRow_couponId_market_key" ON "CouponMarketRow"("couponId", "market");
