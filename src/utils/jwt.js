import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.js";

export const signAccessToken = (payload) =>
  jwt.sign(payload, authConfig.accessSecret, { expiresIn: authConfig.accessExpiresIn });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, authConfig.refreshSecret, { expiresIn: authConfig.refreshExpiresIn });

export const verifyAccessToken = (token) => jwt.verify(token, authConfig.accessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, authConfig.refreshSecret);

