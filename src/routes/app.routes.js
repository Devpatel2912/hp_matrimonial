import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { bootstrap, homeContent } from "../controllers/app.controller.js";

export const appRouter = Router();

appRouter.get("/bootstrap", asyncHandler(bootstrap));
appRouter.get("/home", asyncHandler(homeContent));

