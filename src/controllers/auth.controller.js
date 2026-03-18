import { query } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { compareValue, hashValue } from "../utils/crypto.js";
import { generateOtp } from "../utils/otp.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { ensureUserProfileBundle } from "../services/profileBootstrap.service.js";
import { sendOtp as sendOtpEmail } from "../services/otpDelivery.service.js";

const otpExpiryMinutes = Number(process.env.OTP_EXPIRES_MINUTES || 10);

const issueTokens = (user) => {
  const payload = { userId: user.id, email: user.email, mobile: user.mobile };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

const findUserByIdentifier = async (identifier) => {
  const { rows } = await query(
    "SELECT * FROM users WHERE email = $1 OR mobile = $1 LIMIT 1",
    [identifier]
  );
  return rows[0] || null;
};

const saveFcmTokenForUser = async ({ userId, fcmToken }) => {
  if (!fcmToken) return;
  await query("UPDATE users SET fcm_token = NULL WHERE fcm_token = $1", [fcmToken]);
  await query("UPDATE users SET fcm_token = $1 WHERE id = $2", [fcmToken, userId]);
};

const verifyOtpRecord = async ({ mobileOrEmail, otp }) => {
  const { rows } = await query(
    `SELECT * FROM otp_logs
     WHERE mobile_or_email = $1
     AND is_used = false
     AND expires_at > now()
     ORDER BY created_at DESC
     LIMIT 1`,
    [mobileOrEmail]
  );

  if (!rows[0]) throw new HttpError(400, "Invalid or expired OTP");

  const valid = await compareValue(otp, rows[0].otp_hash);
  if (!valid) throw new HttpError(400, "Invalid OTP");

  await query("UPDATE otp_logs SET is_used = true WHERE id = $1", [rows[0].id]);
};

export const sendOtp = async (req, res) => {
  const { mobileOrEmail } = req.body;

  if (!mobileOrEmail.includes("@")) {
    throw new HttpError(400, "OTP only allowed for email");
  }

  const otp = generateOtp();
  const otpHash = await hashValue(otp);

  await query(
    `INSERT INTO otp_logs (mobile_or_email, otp_hash, expires_at, is_used)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval, false)`,
    [mobileOrEmail, otpHash, otpExpiryMinutes.toString()]
  );

  await sendOtpEmail({ to: mobileOrEmail, otp });

  return res.json({
    success: true,
    message: "OTP sent successfully",
  });
};

export const register = async (req, res) => {
  const { mobile, email, password, otp, fcmToken } = req.body;

  if (!email) throw new HttpError(400, "Email is required");

  await verifyOtpRecord({ mobileOrEmail: email, otp });

  const existing = await findUserByIdentifier(email);
  if (existing) throw new HttpError(409, "User already exists");

  const passwordHash = await hashValue(password);

  const { rows } = await query(
    `INSERT INTO users (mobile, email, password_hash, is_verified, is_active)
     VALUES ($1, $2, $3, true, true)
     RETURNING id, mobile, email`,
    [mobile, email, passwordHash]
  );

  const user = rows[0];

  await ensureUserProfileBundle(user.id);
  await saveFcmTokenForUser({ userId: user.id, fcmToken });

  const tokens = issueTokens(user);

  return res.status(201).json({
    success: true,
    message: "Registration successful",
    data: { user, ...tokens },
  });
};

export const loginWithPassword = async (req, res) => {
  const { identifier, password, fcmToken } = req.body;

  const user = await findUserByIdentifier(identifier);

  if (!user) throw new HttpError(401, "Invalid credentials");
  if (!user.is_active) throw new HttpError(403, "Account inactive");
  if (!user.is_verified) throw new HttpError(403, "Verify your account");

  const ok = await compareValue(password, user.password_hash);
  if (!ok) throw new HttpError(401, "Invalid credentials");

  await query("UPDATE users SET last_login = now() WHERE id = $1", [user.id]);

  await saveFcmTokenForUser({ userId: user.id, fcmToken });

  const tokens = issueTokens(user);

  return res.json({
    success: true,
    message: "Login successful",
    data: { user, ...tokens },
  });
};

export const loginWithOtp = async (req, res) => {
  const { mobileOrEmail, otp, fcmToken } = req.body;

  if (!mobileOrEmail.includes("@")) {
    throw new HttpError(400, "OTP login only allowed with email");
  }

  await verifyOtpRecord({ mobileOrEmail, otp });

  const user = await findUserByIdentifier(mobileOrEmail);

  if (!user) throw new HttpError(404, "User not found");
  if (!user.is_active) throw new HttpError(403, "Account inactive");
  if (!user.is_verified) throw new HttpError(403, "Verify your account");

  await query("UPDATE users SET last_login = now() WHERE id = $1", [user.id]);

  await saveFcmTokenForUser({ userId: user.id, fcmToken });

  const tokens = issueTokens(user);

  return res.json({
    success: true,
    message: "OTP login successful",
    data: { user, ...tokens },
  });
};