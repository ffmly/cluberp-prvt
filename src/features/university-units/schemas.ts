import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.uuid().optional(),
);

export const organizationUnitFormSchema = z
  .object({
    address: z
      .string()
      .trim()
      .max(1000)
      .transform((value) => value || undefined),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9-]{0,19}$/),
    intent: z.enum(["create", "update"]),
    name: z.string().trim().min(2).max(160),
    parentId: optionalUuid,
    status: z.enum(["active", "inactive", "archived"]),
    unitId: optionalUuid,
    unitType: z.enum(["campus", "faculty", "department"]),
    universityId: z.uuid(),
  })
  .superRefine((value, context) => {
    if (value.intent === "update" && !value.unitId) {
      context.addIssue({
        code: "custom",
        message: "Unit identifier is required for updates.",
        path: ["unitId"],
      });
    }

    if (value.unitType !== "campus" && !value.parentId) {
      context.addIssue({
        code: "custom",
        message: "A parent unit is required.",
        path: ["parentId"],
      });
    }
  });

export type OrganizationUnitFormInput = z.infer<
  typeof organizationUnitFormSchema
>;
export type OrganizationUnitStatus = OrganizationUnitFormInput["status"];
export type OrganizationUnitType = OrganizationUnitFormInput["unitType"];
