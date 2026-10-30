import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.uuid().optional(),
);

export const clubRequestSchema = z
  .object({
    clubId: optionalUuid,
    description: z.string().trim().max(5000).transform((value) => value || undefined),
    name: z.string().trim().min(2).max(160),
    requestType: z.enum(["create", "renewal"]),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    universityId: z.uuid(),
  })
  .superRefine((value, context) => {
    if (value.requestType === "renewal" && !value.clubId) {
      context.addIssue({ code: "custom", message: "Club is required.", path: ["clubId"] });
    }
  });

export const clubRequestTransitionSchema = z.object({
  newStatus: z.enum(["under_review", "approved", "rejected"]),
  reason: z.string().trim().max(1000),
  requestId: z.uuid(),
}).superRefine((value, context) => {
  if (value.newStatus === "rejected" && value.reason.length < 5) {
    context.addIssue({ code: "custom", message: "Reason is required.", path: ["reason"] });
  }
});

export type ClubRequestStatus = "submitted" | "under_review" | "approved" | "rejected" | "withdrawn";
