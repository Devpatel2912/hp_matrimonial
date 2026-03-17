import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  deleteMyPhoto,
  getMe,
  getProfileById,
  listMyPhotos,
  setPrimaryPhoto,
  uploadLocalPhoto,
  updateBasic,
  updateEducationCareer,
  updateFamily,
  updatePartnerPreferences,
  updatePrivacy,
  updateSpiritual,
} from "../controllers/profile.controller.js";
import {
  localPhotoUploadSchema,
  updateBasicSchema,
  updateEducationCareerSchema,
  updateFamilySchema,
  updatePartnerPreferencesSchema,
  updatePrivacySchema,
  updateSpiritualSchema,
} from "../schemas/profile.schemas.js";

export const profileRouter = Router();

profileRouter.get("/me", requireAuth, asyncHandler(getMe));
profileRouter.patch("/me/basic", requireAuth, validate(updateBasicSchema), asyncHandler(updateBasic));
profileRouter.patch("/me/spiritual", requireAuth, validate(updateSpiritualSchema), asyncHandler(updateSpiritual));
profileRouter.patch(
  "/me/education-career",
  requireAuth,
  validate(updateEducationCareerSchema),
  asyncHandler(updateEducationCareer)
);
profileRouter.patch("/me/family", requireAuth, validate(updateFamilySchema), asyncHandler(updateFamily));
profileRouter.patch(
  "/me/partner-preferences",
  requireAuth,
  validate(updatePartnerPreferencesSchema),
  asyncHandler(updatePartnerPreferences)
);
profileRouter.patch("/me/privacy", requireAuth, validate(updatePrivacySchema), asyncHandler(updatePrivacy));
profileRouter.post("/me/photos/upload-local", requireAuth, validate(localPhotoUploadSchema), asyncHandler(uploadLocalPhoto));
profileRouter.get("/me/photos", requireAuth, asyncHandler(listMyPhotos));
profileRouter.delete("/me/photos/:photoId", requireAuth, asyncHandler(deleteMyPhoto));
profileRouter.patch("/me/photos/:photoId/primary", requireAuth, asyncHandler(setPrimaryPhoto));
profileRouter.get("/:profileId", optionalAuth, asyncHandler(getProfileById));
