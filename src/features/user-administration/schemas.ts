import { z } from "zod";

export const userStatusFormSchema = z.object({
  newStatus: z.enum(["active", "suspended"]),
  reason: z.string().trim().min(5).max(500),
  targetUserId: z.uuid(),
});

export type UserAccountStatus = z.infer<
  typeof userStatusFormSchema
>["newStatus"];
