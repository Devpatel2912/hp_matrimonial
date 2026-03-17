import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { testDbConnection } from "./config/db.js";
import { validateEnv } from "./config/validateEnv.js";

const PORT = Number(process.env.PORT || 4000);

const start = async () => {
  validateEnv();
  await testDbConnection();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
