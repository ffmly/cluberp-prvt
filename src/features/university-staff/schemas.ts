import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.uuid().optional(),
);
const optionalTitle = z
  .string()
  .trim()
  .max(160)
  .refine((value) => value.length === 0 || value.length >= 2)
  .transform((value) => value || undefined);

const sharedFields = {
  staffType: z.enum(["administrator", "supervisor", "reviewer", "other"]),
  title: optionalTitle,
  universityId: z.uuid(),
};

export const staffAssignmentFormSchema = z
  .discriminatedUnion("intent", [
    z.object({
      ...sharedFields,
      email: z.string().trim().email().toLowerCase().max(320),
      intent: z.literal("create"),
      scopeId: optionalUuid,
      scopeType: z.enum(["university", "campus", "faculty", "department"]),
      status: z.enum(["invited", "active", "suspended"]),
    }),
    z.object({
      ...sharedFields,
      assignmentId: z.uuid(),
      intent: z.literal("update"),
      status: z.enum(["invited", "active", "suspended", "ended"]),
    }),
  ])
  .superRefine((value, context) => {
    if (
      value.intent === "create" &&
      value.scopeType !== "university" &&
      !value.scopeId
    ) {
      context.addIssue({
        code: "custom",
        message: "A scoped assignment requires a unit.",
        path: ["scopeId"],
      });
    }
  });

export type StaffAssignmentInput = z.infer<typeof staffAssignmentFormSchema>;
export type StaffAssignmentStatus = StaffAssignmentInput["status"];
export type StaffScopeType = Extract<
  StaffAssignmentInput,
  { intent: "create" }
>["scopeType"];
export type StaffType = StaffAssignmentInput["staffType"];
