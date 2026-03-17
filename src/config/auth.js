export const authConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || "change_me_access_secret",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "change_me_refresh_secret",
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
};

