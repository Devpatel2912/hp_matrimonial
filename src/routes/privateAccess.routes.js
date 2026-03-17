import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createRequest,
  listIncoming,
  listSent,
  updateRequest,
} from "../controllers/privateAccess.controller.js";
import {
  createPrivateAccessRequestSchema,
  updatePrivateAccessRequestSchema,
} from "../schemas/privateAccess.schemas.js";

export const privateAccessRouter = Router();

privateAccessRouter.post(
  "/requests",
  requireAuth,
  validate(createPrivateAccessRequestSchema),
  asyncHandler(createRequest)
);
privateAccessRouter.get("/requests/incoming", requireAuth, asyncHandler(listIncoming));
privateAccessRouter.get("/requests/sent", requireAuth, asyncHandler(listSent));
privateAccessRouter.patch(
  "/requests/:requestId",
  requireAuth,
  validate(updatePrivateAccessRequestSchema),
  asyncHandler(updateRequest)
);

