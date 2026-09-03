-- CreateTable
CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "pixKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL,
    "splitMode" TEXT NOT NULL DEFAULT 'equal',
    "totalCents" INTEGER NOT NULL,
    "peopleCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "chainSig" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Charge_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Slice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chargeId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "label" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payerName" TEXT,
    "paidAt" DATETIME,
    "pixTxId" TEXT,
    "proofAmountCents" INTEGER,
    "proofRaw" TEXT,
    "chainSig" TEXT,
    "confirmedBy" TEXT NOT NULL DEFAULT 'proof',
    CONSTRAINT "Slice_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "Charge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Charge_slug_key" ON "Charge"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Slice_pixTxId_key" ON "Slice"("pixTxId");

-- CreateIndex
CREATE UNIQUE INDEX "Slice_chargeId_index_key" ON "Slice"("chargeId", "index");
