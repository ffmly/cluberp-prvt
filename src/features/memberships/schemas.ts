import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.uuid().optional(),
);

export const membershipApplicationSchema = z.object({
  applicationType: z.enum(["join", "renewal"]),
  clubId: z.uuid(),
  interests: z.string().trim().max(500).transform((value) => value || undefined),
  membershipId: optionalUuid,
  motivation: z.string().trim().min(10).max(3000),
}).superRefine((value, context) => {
  if (value.applicationType === "renewal" && !value.membershipId) {
    context.addIssue({ code: "custom", message: "Membership is required.", path: ["membershipId"] });
  }
});

export const membershipApplicationTransitionSchema = z.object({
  applicationId: z.uuid(),
  clubId: z.uuid(),
  newStatus: z.enum(["under_review", "approved", "rejected"]),
  reason: z.string().trim().max(1000),
}).superRefine((value, context) => {
  if (value.newStatus === "rejected" && value.reason.length < 5) {
    context.addIssue({ code: "custom", message: "Reason is required.", path: ["reason"] });
  }
});

export const applicationIdSchema = z.object({ applicationId: z.uuid() });

export const membershipStatusSchema = z.object({
  clubId: z.uuid(),
  membershipId: z.uuid(),
  newStatus: z.enum(["active", "suspended", "expired", "removed"]),
  reason: z.string().trim().min(5).max(500),
});

export const resignMembershipSchema = z.object({
  membershipId: z.uuid(),
  reason: z.string().trim().min(5).max(500),
});

export const invitationSchema = z.object({
  clubId: z.uuid(),
  email: z.email().trim().toLowerCase().max(320),
});

export const invitationIdSchema = z.object({
  clubId: z.uuid(),
  invitationId: z.uuid(),
});

export const invitationTokenSchema = z.object({
  token: z.string().trim().min(32).max(256),
});
