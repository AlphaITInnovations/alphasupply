-- Auto-generated from prisma/schema.prisma
-- This runs automatically on first PostgreSQL initialization

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('SERIALIZED', 'STANDARD', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SerialNumberStatus" AS ENUM ('IN_STOCK', 'RESERVED', 'DEPLOYED', 'DEFECTIVE', 'RETURNED', 'DISPOSED');

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Stk',
    "minStockLevel" INTEGER NOT NULL DEFAULT 0,
    "targetStockLevel" INTEGER,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerialNumber" (
    "id" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "status" "SerialNumberStatus" NOT NULL DEFAULT 'IN_STOCK',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT,

    CONSTRAINT "SerialNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLocation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StockLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleSupplier" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierSku" TEXT,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "leadTimeDays" INTEGER,
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "lastOrderDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_sku_key" ON "Article"("sku");
CREATE INDEX "Article_category_idx" ON "Article"("category");
CREATE INDEX "Article_name_idx" ON "Article"("name");

CREATE UNIQUE INDEX "SerialNumber_serialNo_key" ON "SerialNumber"("serialNo");
CREATE INDEX "SerialNumber_articleId_idx" ON "SerialNumber"("articleId");
CREATE INDEX "SerialNumber_status_idx" ON "SerialNumber"("status");

CREATE UNIQUE INDEX "WarehouseLocation_name_key" ON "WarehouseLocation"("name");

CREATE UNIQUE INDEX "StockLocation_articleId_locationId_key" ON "StockLocation"("articleId", "locationId");

CREATE INDEX "StockMovement_articleId_idx" ON "StockMovement"("articleId");
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

CREATE INDEX "ArticleSupplier_articleId_idx" ON "ArticleSupplier"("articleId");
CREATE INDEX "ArticleSupplier_supplierId_idx" ON "ArticleSupplier"("supplierId");
CREATE UNIQUE INDEX "ArticleSupplier_articleId_supplierId_key" ON "ArticleSupplier"("articleId", "supplierId");

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockLocation" ADD CONSTRAINT "StockLocation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockLocation" ADD CONSTRAINT "StockLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArticleSupplier" ADD CONSTRAINT "ArticleSupplier_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleSupplier" ADD CONSTRAINT "ArticleSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: Dummy-Lieferanten
INSERT INTO "Supplier" ("id", "name", "contactName", "email", "phone", "website", "notes", "isActive", "createdAt", "updatedAt") VALUES
  ('sup-telekom', 'Deutsche Telekom', 'Kundenservice Business', 'business@telekom.de', '+49 800 330 1300', 'https://geschaeftskunden.telekom.de', 'Mobilfunk, Festnetz, IT-Infrastruktur', true, NOW(), NOW()),
  ('sup-galaxus', 'Galaxus Deutschland', 'B2B Vertrieb', 'b2b@galaxus.de', '+49 89 2000 889 0', 'https://www.galaxus.de', 'IT-Hardware, Peripherie, Zubehoer', true, NOW(), NOW()),
  ('sup-amazon', 'Amazon Business', 'Amazon Business Support', 'support@amazon.de', NULL, 'https://business.amazon.de', 'Verbrauchsmaterial, Bueroartikel, diverse IT-Artikel', true, NOW(), NOW())
ON CONFLICT DO NOTHING;
