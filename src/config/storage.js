export const getStorageConfig = () => ({
  provider: "local",
  localDir: process.env.STORAGE_LOCAL_DIR || "uploads",
  publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL || `http://27.116.52.24:${process.env.PORT || 8093}`,
});
