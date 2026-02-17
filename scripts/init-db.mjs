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

    // Still run seed data (ON CONFLICT DO NOTHING keeps it safe)
    const seedMatch = sql.match(/-- Seed:[\s\S]*/);
    if (seedMatch) {
      await client.query(seedMatch[0]);
      console.log("Seed data checked.");
    }
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
}

main().catch((err) => {
  console.error("DB init failed:", err.message);
  process.exit(1);
});
