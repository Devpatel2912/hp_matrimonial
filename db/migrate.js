import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

dotenv.config();

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required in .env");
  }

  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = await fs.readFile(schemaPath, "utf8");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Schema migration completed successfully.");
  } finally {
    await client.end();
  }
};

run().catch((err) => {
  console.error("Schema migration failed:", err.message);
  process.exit(1);
});

