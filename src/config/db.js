import pg from "pg";

const { Pool } = pg;

let pool;

const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
};

export const query = (text, params = []) => getPool().query(text, params);

export const testDbConnection = async () => {
  await query("SELECT 1");
};
