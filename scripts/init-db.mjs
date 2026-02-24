import { readFileSync } from "fs";
import pg from "pg";

const sql = readFileSync("./prisma/init.sql", "utf8");

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Check if tables already exist
  const res = await client.query(
    `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Article')`
  );

  if (res.rows[0].exists) {
    console.log("DB schema already exists.");

    // Run migrations for existing DBs
    await runMigrations(client);
  } else {
    console.log("Creating DB schema...");
    await client.query(sql);
    console.log("DB schema + seed data created.");
  }

  await client.end();
}

async function runMigrations(client) {
  // Migration 1: Add isUsed column
  const hasIsUsed = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Article' AND column_name = 'isUsed')`
  );
  if (!hasIsUsed.rows[0].exists) {
    await client.query(`ALTER TABLE "Article" ADD COLUMN "isUsed" BOOLEAN NOT NULL DEFAULT false`);
    console.log("Migration: Added isUsed column.");
  }

  // Migration 2: Add productGroup and productSubGroup columns
  const hasProductGroup = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Article' AND column_name = 'productGroup')`
  );
  if (!hasProductGroup.rows[0].exists) {
    await client.query(`ALTER TABLE "Article" ADD COLUMN "productGroup" TEXT`);
    await client.query(`ALTER TABLE "Article" ADD COLUMN "productSubGroup" TEXT`);
    console.log("Migration: Added productGroup/productSubGroup columns.");
  }

  // Migration 3: Rename SKUs to ART-XXX format
  const hasOldSku = await client.query(
    `SELECT EXISTS (SELECT 1 FROM "Article" WHERE "sku" NOT LIKE 'ART-%' LIMIT 1)`
  );
  if (hasOldSku.rows[0].exists) {
    // Assign ART-001, ART-002, ... in name order
    await client.query(`
      WITH numbered AS (
        SELECT "id", ROW_NUMBER() OVER (ORDER BY "name") AS rn
        FROM "Article"
        WHERE "sku" NOT LIKE 'ART-%'
      )
      UPDATE "Article" a
      SET "sku" = 'ART-' || LPAD(n.rn::text, 3, '0')
      FROM numbered n
      WHERE a."id" = n."id"
    `);
    console.log("Migration: Renamed SKUs to ART-XXX format.");
  }

  // Migration 4: Update productGroup/productSubGroup for seed articles
  await client.query(`
    UPDATE "Article" SET "productGroup" = 'Headset', "productSubGroup" = 'Bluetooth' WHERE "id" = 'art-jabra-ev2-65' AND "productGroup" IS NULL;
    UPDATE "Article" SET "productGroup" = 'Zubehör', "productSubGroup" = 'Taschen' WHERE "id" = 'art-lenovo-t210' AND "productGroup" IS NULL;
    UPDATE "Article" SET "productGroup" = 'Peripherie', "productSubGroup" = 'Tastatur-Maus' WHERE "id" = 'art-dell-km5221w' AND "productGroup" IS NULL;
    UPDATE "Article" SET "productGroup" = 'Telefon', "productSubGroup" = 'IP-Telefon' WHERE "id" = 'art-yealink-t54w' AND "productGroup" IS NULL;
    UPDATE "Article" SET "productGroup" = 'PC', "productSubGroup" = 'Mini-PC' WHERE "id" = 'art-lenovo-neo50q' AND "productGroup" IS NULL;
    UPDATE "Article" SET "productGroup" = 'Notebook', "productSubGroup" = '14 Zoll' WHERE "id" = 'art-lenovo-tb14-g7' AND "productGroup" IS NULL;
    UPDATE "Article" SET "productGroup" = 'Notebook', "productSubGroup" = '16 Zoll' WHERE "id" = 'art-lenovo-tb16-g7' AND "productGroup" IS NULL;
    UPDATE "Article" SET "productGroup" = 'Monitor', "productSubGroup" = '27 Zoll' WHERE "id" = 'art-iiyama-xub2792' AND "productGroup" IS NULL;
    UPDATE "Article" SET "productGroup" = 'Drucker', "productSubGroup" = 'Tintenstrahl' WHERE "id" = 'art-brother-j1800dw' AND "productGroup" IS NULL;
    UPDATE "Article" SET "productGroup" = 'Dockingstation', "productSubGroup" = 'USB-C' WHERE "id" = 'art-lenovo-usbc-dock' AND "productGroup" IS NULL;
  `);

  // Migration 5: Drop targetStockLevel if it exists (no longer used)
  const hasTarget = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Article' AND column_name = 'targetStockLevel')`
  );
  if (hasTarget.rows[0].exists) {
    await client.query(`ALTER TABLE "Article" DROP COLUMN "targetStockLevel"`);
    console.log("Migration: Dropped targetStockLevel column.");
  }

  // Migration 6: Move isUsed from Article to SerialNumber
  const snHasIsUsed = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'SerialNumber' AND column_name = 'isUsed')`
  );
  if (!snHasIsUsed.rows[0].exists) {
    await client.query(`ALTER TABLE "SerialNumber" ADD COLUMN "isUsed" BOOLEAN NOT NULL DEFAULT false`);
    console.log("Migration: Added isUsed to SerialNumber.");
  }

  // Migration 7: Drop isUsed from Article (moved to SerialNumber)
  const articleHasIsUsed = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Article' AND column_name = 'isUsed')`
  );
  if (articleHasIsUsed.rows[0].exists) {
    await client.query(`ALTER TABLE "Article" DROP COLUMN "isUsed"`);
    console.log("Migration: Dropped isUsed from Article.");
  }

  // Migration 8: Add avgPurchasePrice to Article
  const hasAvgPrice = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Article' AND column_name = 'avgPurchasePrice')`
  );
  if (!hasAvgPrice.rows[0].exists) {
    await client.query(`ALTER TABLE "Article" ADD COLUMN "avgPurchasePrice" DECIMAL(10,2)`);
    // Set prices for seed articles (Netto = Brutto / 1.19)
    await client.query(`
      UPDATE "Article" SET "avgPurchasePrice" = 126.04 WHERE "id" = 'art-jabra-ev2-65' AND "avgPurchasePrice" IS NULL;
      UPDATE "Article" SET "avgPurchasePrice" = 21.00 WHERE "id" = 'art-lenovo-t210' AND "avgPurchasePrice" IS NULL;
      UPDATE "Article" SET "avgPurchasePrice" = 37.81 WHERE "id" = 'art-dell-km5221w' AND "avgPurchasePrice" IS NULL;
      UPDATE "Article" SET "avgPurchasePrice" = 104.12 WHERE "id" = 'art-yealink-t54w' AND "avgPurchasePrice" IS NULL;
      UPDATE "Article" SET "avgPurchasePrice" = 416.01 WHERE "id" = 'art-lenovo-neo50q' AND "avgPurchasePrice" IS NULL;
      UPDATE "Article" SET "avgPurchasePrice" = 503.68 WHERE "id" = 'art-lenovo-tb14-g7' AND "avgPurchasePrice" IS NULL;
      UPDATE "Article" SET "avgPurchasePrice" = 507.19 WHERE "id" = 'art-lenovo-tb16-g7' AND "avgPurchasePrice" IS NULL;
      UPDATE "Article" SET "avgPurchasePrice" = 99.45 WHERE "id" = 'art-iiyama-xub2792' AND "avgPurchasePrice" IS NULL;
      UPDATE "Article" SET "avgPurchasePrice" = 167.65 WHERE "id" = 'art-brother-j1800dw' AND "avgPurchasePrice" IS NULL;
      UPDATE "Article" SET "avgPurchasePrice" = 103.99 WHERE "id" = 'art-lenovo-usbc-dock' AND "avgPurchasePrice" IS NULL;
    `);
    console.log("Migration: Added avgPurchasePrice to Article.");
  }

  // Migration 9: Create Order + OrderItem tables
  const hasOrderTable = await client.query(
    `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Order')`
  );
  if (!hasOrderTable.rows[0].exists) {
    await client.query(`CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED')`).catch(() => {});
    await client.query(`CREATE TYPE "DeliveryMethod" AS ENUM ('SHIPPING', 'PICKUP')`).catch(() => {});
    await client.query(`
      CREATE TABLE "Order" (
        "id" TEXT NOT NULL,
        "orderNumber" TEXT NOT NULL,
        "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
        "orderedBy" TEXT NOT NULL,
        "orderedFor" TEXT NOT NULL,
        "costCenter" TEXT NOT NULL,
        "deliveryMethod" "DeliveryMethod" NOT NULL,
        "shippingCompany" TEXT,
        "shippingStreet" TEXT,
        "shippingZip" TEXT,
        "shippingCity" TEXT,
        "pickupBy" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
      CREATE INDEX "Order_status_idx" ON "Order"("status");
      CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

      CREATE TABLE "OrderItem" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "articleId" TEXT,
        "freeText" TEXT,
        "quantity" INTEGER NOT NULL,
        CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
      ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON UPDATE CASCADE;
    `);
    console.log("Migration: Created Order + OrderItem tables.");
  }

  // Migration 10: Structured shipping address, free text order items, incomingStock
  const hasShippingCompany = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'shippingCompany')`
  );
  if (!hasShippingCompany.rows[0].exists) {
    // Replace shippingAddress with structured fields
    await client.query(`ALTER TABLE "Order" ADD COLUMN "shippingCompany" TEXT`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "shippingStreet" TEXT`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "shippingZip" TEXT`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "shippingCity" TEXT`);
    // Migrate existing data: put old shippingAddress into shippingStreet
    await client.query(`UPDATE "Order" SET "shippingStreet" = "shippingAddress" WHERE "shippingAddress" IS NOT NULL`);
    await client.query(`ALTER TABLE "Order" DROP COLUMN IF EXISTS "shippingAddress"`);
    console.log("Migration: Structured shipping address on Order.");
  }

  // Add freeText column to OrderItem
  const hasFreeText = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'OrderItem' AND column_name = 'freeText')`
  );
  if (!hasFreeText.rows[0].exists) {
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "freeText" TEXT`);
    // Make articleId nullable
    await client.query(`ALTER TABLE "OrderItem" ALTER COLUMN "articleId" DROP NOT NULL`);
    // Drop the unique constraint on (orderId, articleId) if it exists
    await client.query(`DROP INDEX IF EXISTS "OrderItem_orderId_articleId_key"`);
    console.log("Migration: Added freeText to OrderItem, made articleId nullable.");
  }

  // Add incomingStock to Article
  const hasIncomingStock = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Article' AND column_name = 'incomingStock')`
  );
  if (!hasIncomingStock.rows[0].exists) {
    await client.query(`ALTER TABLE "Article" ADD COLUMN "incomingStock" INTEGER NOT NULL DEFAULT 0`);
    console.log("Migration: Added incomingStock to Article.");
  }

  // Migration 11: Create OrderMobilfunk table (NOTE: keep this before migration 12)
  const hasMobilfunkTable = await client.query(
    `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'OrderMobilfunk')`
  );
  if (!hasMobilfunkTable.rows[0].exists) {
    await client.query(`CREATE TYPE "MobilfunkType" AS ENUM ('PHONE_AND_SIM', 'PHONE_ONLY', 'SIM_ONLY')`).catch(() => {});
    await client.query(`CREATE TYPE "SimType" AS ENUM ('SIM', 'ESIM')`).catch(() => {});
    await client.query(`CREATE TYPE "MobilfunkTariff" AS ENUM ('STANDARD', 'UNLIMITED')`).catch(() => {});
    await client.query(`
      CREATE TABLE "OrderMobilfunk" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "type" "MobilfunkType" NOT NULL,
        "simType" "SimType",
        "tariff" "MobilfunkTariff",
        "phoneNote" TEXT,
        "simNote" TEXT,
        "delivered" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "OrderMobilfunk_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX "OrderMobilfunk_orderId_idx" ON "OrderMobilfunk"("orderId");
      ALTER TABLE "OrderMobilfunk" ADD CONSTRAINT "OrderMobilfunk_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    console.log("Migration: Created OrderMobilfunk table.");
  }
  // Migration 12: Parallel order lifecycle fields
  const hasTrackingNumber = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'trackingNumber')`
  );
  if (!hasTrackingNumber.rows[0].exists) {
    // Order: new lifecycle fields
    await client.query(`ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3)`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "shippedBy" TEXT`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "technicianName" TEXT`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "techDoneAt" TIMESTAMP(3)`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "procDoneAt" TIMESTAMP(3)`);

    // OrderItem: techniker stream
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "pickedQty" INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "serialNumberId" TEXT`);
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "pickedBy" TEXT`);
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "pickedAt" TIMESTAMP(3)`);
    // OrderItem: bestell stream
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "needsOrdering" BOOLEAN NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "supplierId" TEXT`);
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "supplierOrderNo" TEXT`);
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "orderedAt" TIMESTAMP(3)`);
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "orderedBy" TEXT`);
    // OrderItem: wareneingang stream
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "receivedQty" INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE "OrderItem" ADD COLUMN "receivedAt" TIMESTAMP(3)`);
    // OrderItem: supplier FK
    await client.query(`ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE`);

    // OrderMobilfunk: techniker setup
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "imei" TEXT`);
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "phoneNumber" TEXT`);
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "setupDone" BOOLEAN NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "setupBy" TEXT`);
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "setupAt" TIMESTAMP(3)`);
    // OrderMobilfunk: bestell stream
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "ordered" BOOLEAN NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "orderedBy" TEXT`);
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "orderedAt" TIMESTAMP(3)`);
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "providerOrderNo" TEXT`);
    // OrderMobilfunk: wareneingang stream
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "received" BOOLEAN NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE "OrderMobilfunk" ADD COLUMN "receivedAt" TIMESTAMP(3)`);

    // StockMovement: order audit trail
    await client.query(`ALTER TABLE "StockMovement" ADD COLUMN "orderId" TEXT`);
    await client.query(`ALTER TABLE "StockMovement" ADD COLUMN "orderItemId" TEXT`);
    await client.query(`ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    await client.query(`ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE`);

    // SerialNumber: order item link
    await client.query(`ALTER TABLE "SerialNumber" ADD COLUMN "orderItemId" TEXT`);
    await client.query(`ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE`);

    console.log("Migration 12: Added parallel order lifecycle fields.");
  }

  // Migration 13: New seed articles (LC-421 Value Pack, HP G5 Dock, Logitech Brio 100)
  // Uses dynamic SKU assignment to avoid conflicts with app-created articles
  const newSeedArticles = [
    { id: 'art-brother-lc421vp', name: 'Brother LC-421 Value Pack', desc: 'Tintenpatronen-Set (BK/C/M/Y) fuer DCP-J1800DW', category: 'LOW_TIER', group: 'Verbrauchsmaterial', sub: 'Tinte', price: 30.00, unit: 'Set', min: 2 },
    { id: 'art-hp-usbc-g5-dock', name: 'HP USB-C G5 Essential Dock', desc: 'USB-C Dockingstation EMEA', category: 'HIGH_TIER', group: 'Dockingstation', sub: 'USB-C', price: 99.00, unit: 'Stk', min: 1 },
    { id: 'art-logitech-brio100', name: 'Logitech Brio 100', desc: 'Full HD Webcam 2 Mpx USB', category: 'HIGH_TIER', group: 'Peripherie', sub: 'Webcam', price: 33.00, unit: 'Stk', min: 2 },
  ];

  // Get next available SKU number
  const maxSkuRes = await client.query(
    `SELECT COALESCE(MAX(CAST(REPLACE("sku", 'ART-', '') AS INTEGER)), 0) AS max_num FROM "Article" WHERE "sku" LIKE 'ART-%'`
  );
  let nextSkuNum = maxSkuRes.rows[0].max_num + 1;

  for (const art of newSeedArticles) {
    const exists = await client.query(`SELECT EXISTS (SELECT 1 FROM "Article" WHERE "id" = $1)`, [art.id]);
    if (!exists.rows[0].exists) {
      const sku = `ART-${String(nextSkuNum).padStart(3, '0')}`;
      await client.query(
        `INSERT INTO "Article" ("id", "name", "description", "sku", "category", "productGroup", "productSubGroup", "avgPurchasePrice", "unit", "minStockLevel", "currentStock", "imageUrl", "isActive", "notes", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5::"ArticleCategory", $6, $7, $8, $9, $10, 0, NULL, true, NULL, NOW(), NOW())`,
        [art.id, art.name, art.desc, sku, art.category, art.group, art.sub, art.price, art.unit, art.min]
      );
      nextSkuNum++;
      console.log(`Migration 13: Created article ${art.name} (${sku}).`);
    }
  }

  // Supplier links (only insert if both article and supplier exist)
  const supplierLinks = [
    { id: 'as-lc421-amazon', articleId: 'art-brother-lc421vp', supplierId: 'sup-amazon', price: 35.70, lead: 3 },
    { id: 'as-hp-dock-galaxus', articleId: 'art-hp-usbc-g5-dock', supplierId: 'sup-galaxus', price: 117.81, lead: 5 },
    { id: 'as-brio100-galaxus', articleId: 'art-logitech-brio100', supplierId: 'sup-galaxus', price: 39.27, lead: 5 },
  ];

  for (const link of supplierLinks) {
    const artExists = await client.query(`SELECT EXISTS (SELECT 1 FROM "Article" WHERE "id" = $1)`, [link.articleId]);
    const supExists = await client.query(`SELECT EXISTS (SELECT 1 FROM "Supplier" WHERE "id" = $1)`, [link.supplierId]);
    if (artExists.rows[0].exists && supExists.rows[0].exists) {
      await client.query(
        `INSERT INTO "ArticleSupplier" ("id", "articleId", "supplierId", "supplierSku", "unitPrice", "currency", "leadTimeDays", "minOrderQty", "isPreferred", "lastOrderDate", "notes", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NULL, $4, 'EUR', $5, 1, true, NULL, NULL, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [link.id, link.articleId, link.supplierId, link.price, link.lead]
      );
    }
  }
  console.log("Migration 13: Seed articles checked.");

  // Migration 14: Tier system rename + Order status expansion
  // Rename ArticleCategory enum values: SERIALIZED→HIGH_TIER, STANDARD→MID_TIER, CONSUMABLE→LOW_TIER
  const hasOldCategory = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SERIALIZED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ArticleCategory'))`
  );
  if (hasOldCategory.rows[0].exists) {
    await client.query(`ALTER TYPE "ArticleCategory" RENAME VALUE 'SERIALIZED' TO 'HIGH_TIER'`);
    await client.query(`ALTER TYPE "ArticleCategory" RENAME VALUE 'STANDARD' TO 'MID_TIER'`);
    await client.query(`ALTER TYPE "ArticleCategory" RENAME VALUE 'CONSUMABLE' TO 'LOW_TIER'`);
    console.log("Migration 14: Renamed ArticleCategory to tier system.");
  }

  // Rename/add OrderStatus values
  const hasInProgress = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN_PROGRESS' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus'))`
  );
  if (hasInProgress.rows[0].exists) {
    await client.query(`ALTER TYPE "OrderStatus" RENAME VALUE 'IN_PROGRESS' TO 'IN_COMMISSION'`);
    console.log("Migration 14: Renamed IN_PROGRESS to IN_COMMISSION.");
  }
  const hasReady = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'READY' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus'))`
  );
  if (hasReady.rows[0].exists) {
    await client.query(`ALTER TYPE "OrderStatus" RENAME VALUE 'READY' TO 'READY_TO_SHIP'`);
    console.log("Migration 14: Renamed READY to READY_TO_SHIP.");
  }

  // Add new enum values if missing
  const hasInSetup = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN_SETUP' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus'))`
  );
  if (!hasInSetup.rows[0].exists) {
    await client.query(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'IN_SETUP'`);
    console.log("Migration 14: Added IN_SETUP status.");
  }
  const hasShipped = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SHIPPED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrderStatus'))`
  );
  if (!hasShipped.rows[0].exists) {
    await client.query(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'SHIPPED'`);
    console.log("Migration 14: Added SHIPPED status.");
  }

  // Add new Order columns
  const hasCommissionedAt = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'commissionedAt')`
  );
  if (!hasCommissionedAt.rows[0].exists) {
    await client.query(`ALTER TABLE "Order" ADD COLUMN "commissionedAt" TIMESTAMP(3)`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "commissionedBy" TEXT`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "setupDoneAt" TIMESTAMP(3)`);
    await client.query(`ALTER TABLE "Order" ADD COLUMN "setupDoneBy" TEXT`);
    console.log("Migration 14: Added commission/setup columns to Order.");
  }
}

main().catch((err) => {
  console.error("DB init failed:", err.message);
  process.exit(1);
});
