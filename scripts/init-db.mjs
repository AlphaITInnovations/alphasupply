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

  // Migration 3: Drop targetStockLevel if it exists (no longer used)
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
