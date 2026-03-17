import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { profileRouter } from "./profile.routes.js";
import { discoveryRouter } from "./discovery.routes.js";
import { appRouter } from "./app.routes.js";
import { privateAccessRouter } from "./privateAccess.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/profiles", profileRouter);
apiRouter.use("/discovery", discoveryRouter);
apiRouter.use("/app", appRouter);
apiRouter.use("/private-access", privateAccessRouter);
