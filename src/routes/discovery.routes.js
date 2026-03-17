import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { discoveryQuerySchema } from "../schemas/discovery.schemas.js";
import { filterMeta, listProfiles } from "../controllers/discovery.controller.js";

export const discoveryRouter = Router();

discoveryRouter.get("/profiles", optionalAuth, validate(discoveryQuerySchema, "query"), asyncHandler(listProfiles));
discoveryRouter.get("/filters/meta", asyncHandler(filterMeta));

