import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.uuid().optional(),
);

export const roleFormSchema = z.object({
  description: z.string().trim().max(500).transform((value) => value || undefined),
  key: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{1,63}$/),
  name: z.string().trim().min(2).max(120),
  permissionKeys: z.array(z.string().min(3).max(100)).min(1),
  roleId: optionalUuid,
});

export const roleAssignmentSchema = z.object({
  roleId: z.uuid(),
  userId: z.uuid(),
});

export const roleLifecycleSchema = z.object({
  intent: z.enum(["archive", "revoke"]),
  reason: z.string().trim().min(5).max(500),
  targetId: z.uuid(),
});
