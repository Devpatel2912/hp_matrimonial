import { z } from "zod";

export const updateBasicSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  gender: z.string().max(10).optional(),
  date_of_birth: z.string().date().optional(),
  height: z.string().max(10).optional(),
  marital_status: z.string().max(30).optional(),
  mother_tongue: z.string().max(50).optional(),
  caste: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(50).optional(),
  about_me: z.string().max(2000).optional(),
  income_range: z.string().max(50).optional(),
});

export const updateSpiritualSchema = z.object({
  karya_karta: z.string().max(100).optional(),
  pradesh: z.string().max(100).optional(),
  bhagvadi: z.string().max(100).optional(),
});

export const updateEducationCareerSchema = z.object({
  highest_education: z.string().max(100).optional(),
  institute: z.string().max(150).optional(),
  occupation: z.string().max(100).optional(),
  employer: z.string().max(150).optional(),
  income_range: z.string().max(50).optional(),
});

export const updateFamilySchema = z.object({
  father_name: z.string().max(100).optional(),
  father_occupation: z.string().max(100).optional(),
  mother_name: z.string().max(100).optional(),
  mother_occupation: z.string().max(100).optional(),
  siblings: z.string().max(2000).optional(),
  family_type: z.string().max(50).optional(),
  family_status: z.string().max(50).optional(),
  is_locked: z.boolean().optional(),
});

export const updatePartnerPreferencesSchema = z.object({
  age_min: z.number().int().min(18).max(80).optional(),
  age_max: z.number().int().min(18).max(80).optional(),
  height_min: z.string().max(10).optional(),
  height_max: z.string().max(10).optional(),
  diet: z.string().max(50).optional(),
  marital_status: z.string().max(50).optional(),
  faith: z.string().max(50).optional(),
  caste_preference: z.string().max(100).optional(),
  state_preference: z.string().max(100).optional(),
  education_preference: z.string().max(100).optional(),
});

export const updatePrivacySchema = z.object({
  photo_locked: z.boolean().optional(),
  family_locked: z.boolean().optional(),
});

export const localPhotoUploadSchema = z.object({
  fileName: z.string().min(3).max(200),
  contentType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|webp)$/i, "Only jpeg/jpg/png/webp images are allowed"),
  fileBase64: z.string().min(20),
  visibility: z.enum(["public", "locked"]).default("locked"),
  is_primary: z.boolean().default(false),
});
