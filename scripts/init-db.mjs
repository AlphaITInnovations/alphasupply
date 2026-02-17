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
    console.log("DB schema already exists, skipping init.");
  } else {
    console.log("Creating DB schema...");
    await client.query(sql);
    console.log("DB schema created successfully.");
  }

  await client.end();
}

main().catch((err) => {
  console.error("DB init failed:", err.message);
  process.exit(1);
});
