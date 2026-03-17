export const getStorageConfig = () => ({
  provider: "local",
  localDir: process.env.STORAGE_LOCAL_DIR || "uploads",
  publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
});
