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

-- Seed: Lieferanten
INSERT INTO "Supplier" ("id", "name", "contactName", "email", "phone", "website", "notes", "isActive", "createdAt", "updatedAt") VALUES
  ('sup-telekom', 'Deutsche Telekom', 'Kundenservice Business', 'business@telekom.de', '+49 800 330 1300', 'https://geschaeftskunden.telekom.de', 'Mobilfunk, Festnetz, IT-Infrastruktur', true, NOW(), NOW()),
  ('sup-galaxus', 'Galaxus Deutschland', 'B2B Vertrieb', 'b2b@galaxus.de', '+49 89 2000 889 0', 'https://www.galaxus.de', 'IT-Hardware, Peripherie, Zubehoer', true, NOW(), NOW()),
  ('sup-amazon', 'Amazon Business', 'Amazon Business Support', 'support@amazon.de', NULL, 'https://business.amazon.de', 'Verbrauchsmaterial, Bueroartikel, diverse IT-Artikel', true, NOW(), NOW()),
  ('sup-tdg', 'TDG-Premium', 'Vertrieb', NULL, NULL, 'https://www.tdg-premium.de', 'IT-Hardware Distributor', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Seed: Testartikel
INSERT INTO "Article" ("id", "name", "description", "sku", "category", "unit", "minStockLevel", "targetStockLevel", "currentStock", "imageUrl", "isActive", "notes", "createdAt", "updatedAt") VALUES
  ('art-jabra-ev2-65', 'Jabra Evolve2 65', 'Bluetooth-Headset mit ANC', 'JAB-EV2-65', 'SERIALIZED', 'Stk', 2, 5, 1, NULL, true, NULL, NOW(), NOW()),
  ('art-lenovo-t210', 'Lenovo T210 Tasche', '15.6 Zoll Laptop-Tasche', 'LEN-T210', 'STANDARD', 'Stk', 3, 10, 1, NULL, true, NULL, NOW(), NOW()),
  ('art-dell-km5221w', 'Dell KM5221W', 'Wireless Tastatur-Maus-Set', 'DELL-KM5221W', 'STANDARD', 'Stk', 5, 15, 1, NULL, true, NULL, NOW(), NOW()),
  ('art-yealink-t54w', 'Yealink SIP-T54W', 'IP-Telefon Schwarz 10 Zeilen LCD WLAN', 'YEA-T54W', 'SERIALIZED', 'Stk', 2, 5, 1, NULL, true, NULL, NOW(), NOW()),
  ('art-lenovo-neo50q', 'Lenovo ThinkCentre neo 50q Gen 4', 'Intel Core i5-13420H 16 GB DDR4 512 GB SSD Win11 Pro Mini-PC', 'LEN-NEO50Q', 'SERIALIZED', 'Stk', 1, 3, 1, NULL, true, NULL, NOW(), NOW()),
  ('art-lenovo-tb14-g7', 'Lenovo ThinkBook 14 G7 ARP', 'AMD Ryzen 5 7535HS 14" WUXGA 16 GB DDR5 512 GB SSD Win11 Pro', 'LEN-TB14-G7', 'SERIALIZED', 'Stk', 1, 3, 1, NULL, true, NULL, NOW(), NOW()),
  ('art-lenovo-tb16-g7', 'Lenovo ThinkBook 16 G7 ARP', 'AMD Ryzen 5 7535HS 16" WUXGA 16 GB DDR5 512 GB SSD Win11 Pro', 'LEN-TB16-G7', 'SERIALIZED', 'Stk', 1, 3, 1, NULL, true, NULL, NOW(), NOW()),
  ('art-iiyama-xub2792', 'iiyama ProLite XUB2792HSU-W6', '27" Full HD IPS Monitor 1920x1080 weiss', 'IIY-XUB2792', 'SERIALIZED', 'Stk', 2, 5, 1, NULL, true, NULL, NOW(), NOW()),
  ('art-brother-j1800dw', 'Brother DCP-J1800DW', 'Tintenstrahl-Multifunktionsdrucker A4 WLAN', 'BRO-J1800DW', 'SERIALIZED', 'Stk', 1, 2, 1, NULL, true, NULL, NOW(), NOW()),
  ('art-lenovo-usbc-dock', 'Lenovo ThinkPad Universal USB-C Dock', 'USB-C Dockingstation 40AY0090EU', 'LEN-USBC-DOCK', 'SERIALIZED', 'Stk', 2, 5, 1, NULL, true, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Seed: Seriennummern (nur SERIALIZED Artikel)
INSERT INTO "SerialNumber" ("id", "serialNo", "articleId", "status", "notes", "createdAt", "updatedAt", "locationId") VALUES
  ('sn-jabra-001', 'JAB-EV2-2024-00847', 'art-jabra-ev2-65', 'IN_STOCK', NULL, NOW(), NOW(), NULL),
  ('sn-yealink-001', 'YEA-T54W-2024-01205', 'art-yealink-t54w', 'IN_STOCK', NULL, NOW(), NOW(), NULL),
  ('sn-neo50q-001', 'LEN-NEO50Q-2024-08341', 'art-lenovo-neo50q', 'IN_STOCK', NULL, NOW(), NOW(), NULL),
  ('sn-tb14-001', 'LEN-TB14G7-2024-05672', 'art-lenovo-tb14-g7', 'IN_STOCK', NULL, NOW(), NOW(), NULL),
  ('sn-tb16-001', 'LEN-TB16G7-2024-03891', 'art-lenovo-tb16-g7', 'IN_STOCK', NULL, NOW(), NOW(), NULL),
  ('sn-iiyama-001', 'IIY-XUB27-2024-12450', 'art-iiyama-xub2792', 'IN_STOCK', NULL, NOW(), NOW(), NULL),
  ('sn-brother-001', 'BRO-J1800-2024-07823', 'art-brother-j1800dw', 'IN_STOCK', NULL, NOW(), NOW(), NULL),
  ('sn-dock-001', 'LEN-DOCK-2024-01523', 'art-lenovo-usbc-dock', 'IN_STOCK', NULL, NOW(), NOW(), NULL)
ON CONFLICT DO NOTHING;

-- Seed: Lagerbewegungen (Erstlieferung)
INSERT INTO "StockMovement" ("id", "articleId", "type", "quantity", "reason", "performedBy", "createdAt") VALUES
  ('sm-jabra-001', 'art-jabra-ev2-65', 'IN', 1, 'Erstlieferung', 'System', NOW()),
  ('sm-t210-001', 'art-lenovo-t210', 'IN', 1, 'Erstlieferung', 'System', NOW()),
  ('sm-dell-001', 'art-dell-km5221w', 'IN', 1, 'Erstlieferung', 'System', NOW()),
  ('sm-yealink-001', 'art-yealink-t54w', 'IN', 1, 'Erstlieferung', 'System', NOW()),
  ('sm-neo50q-001', 'art-lenovo-neo50q', 'IN', 1, 'Erstlieferung', 'System', NOW()),
  ('sm-tb14-001', 'art-lenovo-tb14-g7', 'IN', 1, 'Erstlieferung', 'System', NOW()),
  ('sm-tb16-001', 'art-lenovo-tb16-g7', 'IN', 1, 'Erstlieferung', 'System', NOW()),
  ('sm-iiyama-001', 'art-iiyama-xub2792', 'IN', 1, 'Erstlieferung', 'System', NOW()),
  ('sm-brother-001', 'art-brother-j1800dw', 'IN', 1, 'Erstlieferung', 'System', NOW()),
  ('sm-dock-001', 'art-lenovo-usbc-dock', 'IN', 1, 'Erstlieferung', 'System', NOW())
ON CONFLICT DO NOTHING;

-- Seed: Artikel-Lieferanten Zuordnung
INSERT INTO "ArticleSupplier" ("id", "articleId", "supplierId", "supplierSku", "unitPrice", "currency", "leadTimeDays", "minOrderQty", "isPreferred", "lastOrderDate", "notes", "createdAt", "updatedAt") VALUES
  ('as-jabra-tdg', 'art-jabra-ev2-65', 'sup-tdg', NULL, 149.99, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW()),
  ('as-t210-tdg', 'art-lenovo-t210', 'sup-tdg', NULL, 24.99, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW()),
  ('as-dell-tdg', 'art-dell-km5221w', 'sup-tdg', NULL, 44.99, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW()),
  ('as-yealink-tdg', 'art-yealink-t54w', 'sup-tdg', '1301081', 123.90, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW()),
  ('as-neo50q-tdg', 'art-lenovo-neo50q', 'sup-tdg', '12LN001EGE', 495.01, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW()),
  ('as-tb14-tdg', 'art-lenovo-tb14-g7', 'sup-tdg', '21MV001HGE', 599.38, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW()),
  ('as-tb16-tdg', 'art-lenovo-tb16-g7', 'sup-tdg', '21MW001WGE', 603.56, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW()),
  ('as-iiyama-tdg', 'art-iiyama-xub2792', 'sup-tdg', 'XUB2792HSU-W6', 118.34, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW()),
  ('as-brother-tdg', 'art-brother-j1800dw', 'sup-tdg', 'DCP-J1800DW', 199.50, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW()),
  ('as-dock-tdg', 'art-lenovo-usbc-dock', 'sup-tdg', '40AY0090EU', 123.74, 'EUR', 10, 1, true, NULL, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;
