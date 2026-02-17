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

main().catch((err) => {
  console.error("DB init failed:", err.message);
  process.exit(1);
});
