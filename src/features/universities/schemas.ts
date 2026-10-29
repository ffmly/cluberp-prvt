import { z } from "zod";

const universityStatuses = [
  "draft",
  "active",
  "suspended",
  "archived",
] as const;

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const universityFields = {
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(universityStatuses),
  defaultLocale: z.enum(["en", "ar"]),
  defaultTimeZone: z.string().trim().min(1).max(100).refine(isValidTimeZone),
  defaultCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
};

export const universityFormSchema = z.discriminatedUnion("intent", [
  z.object({
    ...universityFields,
    intent: z.literal("create"),
  }),
  z.object({
    ...universityFields,
    intent: z.literal("update"),
    universityId: z.uuid(),
  }),
]);

export type UniversityFormInput = z.infer<typeof universityFormSchema>;
export type UniversityStatus = (typeof universityStatuses)[number];
