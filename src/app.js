import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { getStorageConfig } from "./config/storage.js";
import { apiRouter } from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const createApp = () => {
  const app = express();
  app.use(express.json());
  const storageConfig = getStorageConfig();
  app.use("/uploads", express.static(path.resolve(storageConfig.localDir)));
  app.get("/uploads-list", async (_req, res, next) => {
    try {
      const baseDir = path.resolve(storageConfig.localDir);
      const entries = await fs.readdir(baseDir, { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile())
        .map((e) => ({
          name: e.name,
          url: `${storageConfig.publicBaseUrl.replace(/\/$/, "")}/uploads/${e.name}`,
        }));
      return res.json({ success: true, message: "Uploads listed", data: files });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ success: true, message: "ok" });
  });

  app.use("/api/v1", apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
