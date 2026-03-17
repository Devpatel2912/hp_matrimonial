import { verifyAccessToken } from "../utils/jwt.js";
import { HttpError } from "../utils/httpError.js";

const parseBearer = (authHeader) => {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

export const requireAuth = (req, _res, next) => {
  const token = parseBearer(req.headers.authorization);
  if (!token) throw new HttpError(401, "Unauthorized");
  const payload = verifyAccessToken(token);
  req.user = payload;
  next();
};

export const optionalAuth = (req, _res, next) => {
  const token = parseBearer(req.headers.authorization);
  if (!token) return next();
  try {
    req.user = verifyAccessToken(token);
  } catch (_e) {
    req.user = null;
  }
  next();
};

