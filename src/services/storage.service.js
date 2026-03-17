import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getStorageConfig } from "../config/storage.js";

const safeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

export const deletePhotoObject = async ({ storageKey }) => {
  const storageConfig = getStorageConfig();
  const fullPath = path.resolve(storageConfig.localDir, storageKey);
  await fs.rm(fullPath, { force: true });
};

export const saveLocalPhoto = async ({ userId, fileName, fileBuffer }) => {
  const storageConfig = getStorageConfig();
  const key = `profiles/${userId}/${Date.now()}-${randomUUID()}-${safeName(fileName)}`;
  const fullPath = path.resolve(storageConfig.localDir, key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, fileBuffer);
  const fileUrl = `${storageConfig.publicBaseUrl.replace(/\/$/, "")}/uploads/${key}`;
  return { storageKey: key, fileUrl };
};
