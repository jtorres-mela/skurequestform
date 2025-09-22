-- CreateTable
CREATE TABLE "EmailRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "emailName" TEXT NOT NULL,
    "sendDate" DATETIME,
    "subject" TEXT NOT NULL,
    "preheader" TEXT,
    "bodyCopy" TEXT,
    "deptBilled" TEXT,
    "sendList" TEXT,
    "sendFrom" TEXT,
    CONSTRAINT "EmailRequest_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailRequestMarket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "emailRequestId" INTEGER NOT NULL,
    "market" TEXT NOT NULL,
    CONSTRAINT "EmailRequestMarket_emailRequestId_fkey" FOREIGN KEY ("emailRequestId") REFERENCES "EmailRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailRequestCulture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "emailRequestId" INTEGER NOT NULL,
    "cultureCode" TEXT NOT NULL,
    CONSTRAINT "EmailRequestCulture_emailRequestId_fkey" FOREIGN KEY ("emailRequestId") REFERENCES "EmailRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailRequestAsset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "emailRequestId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "imagePath" TEXT,
    "linkTo" TEXT,
    CONSTRAINT "EmailRequestAsset_emailRequestId_fkey" FOREIGN KEY ("emailRequestId") REFERENCES "EmailRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailRequest_requestId_key" ON "EmailRequest"("requestId");

-- CreateIndex
CREATE INDEX "EmailRequest_sendDate_idx" ON "EmailRequest"("sendDate");

-- CreateIndex
CREATE INDEX "EmailRequestMarket_market_idx" ON "EmailRequestMarket"("market");

-- CreateIndex
CREATE UNIQUE INDEX "EmailRequestMarket_emailRequestId_market_key" ON "EmailRequestMarket"("emailRequestId", "market");

-- CreateIndex
CREATE INDEX "EmailRequestCulture_cultureCode_idx" ON "EmailRequestCulture"("cultureCode");

-- CreateIndex
CREATE UNIQUE INDEX "EmailRequestCulture_emailRequestId_cultureCode_key" ON "EmailRequestCulture"("emailRequestId", "cultureCode");

-- CreateIndex
CREATE INDEX "EmailRequestAsset_emailRequestId_idx" ON "EmailRequestAsset"("emailRequestId");
