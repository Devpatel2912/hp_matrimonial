import { z } from "zod";

const toInt = (v) => (v === undefined ? undefined : Number(v));

export const discoveryQuerySchema = z.object({
  q: z.string().max(100).optional(),
  caste: z.string().max(50).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  education: z.string().max(100).optional(),
  ageMin: z.preprocess(toInt, z.number().int().min(18).max(80).optional()),
  ageMax: z.preprocess(toInt, z.number().int().min(18).max(80).optional()),
  page: z.preprocess(toInt, z.number().int().min(1).max(1000).default(1)),
  limit: z.preprocess(toInt, z.number().int().min(1).max(50).default(20)),
  sortBy: z.enum(["recent", "age_asc", "age_desc"]).default("recent"),
});

