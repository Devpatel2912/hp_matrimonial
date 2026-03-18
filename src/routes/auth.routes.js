

import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

import {
  loginWithOtp,
  loginWithPassword,
  register,
  sendOtp,
} from "../controllers/auth.controller.js";

import {
  loginOtpSchema,
  loginPasswordSchema,
  registerSchema,
  sendOtpSchema,
} from "../schemas/auth.schemas.js";

export const authRouter = Router();

authRouter.post("/otp/send", validate(sendOtpSchema), asyncHandler(sendOtp));
authRouter.post("/register", validate(registerSchema), asyncHandler(register));

authRouter.post("/login/password", validate(loginPasswordSchema), asyncHandler(loginWithPassword));
authRouter.post("/login/otp", validate(loginOtpSchema), asyncHandler(loginWithOtp));