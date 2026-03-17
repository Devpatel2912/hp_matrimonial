import { z } from "zod";

export const createPrivateAccessRequestSchema = z.object({
  profileId: z.string().min(5),
  message: z.string().max(1000).optional(),
});

export const updatePrivateAccessRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

