import { z } from "zod";

const dateTime = z.string().trim().min(1).transform((value, context) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    context.addIssue({ code: "custom", message: "Invalid date and time." });
    return z.NEVER;
  }
  return date.toISOString();
});

const optionalCapacity = z.preprocess(
  (value) => (value === "" || value === null ? null : Number(value)),
  z.number().int().min(1).max(100000).nullable(),
);

export const eventSchema = z.object({
  capacity: optionalCapacity,
  clubId: z.uuid(),
  description: z.string().trim().min(10).max(8000),
  eligibility: z.enum(["authenticated", "active_members"]),
  endsAt: dateTime,
  eventId: z.preprocess((value) => value || undefined, z.uuid().optional()),
  eventType: z.enum(["event", "workshop"]),
  location: z.string().trim().min(2).max(300),
  registrationDeadline: dateTime,
  startsAt: dateTime,
  title: z.string().trim().min(3).max(180),
  visibility: z.enum(["public", "members"]),
}).superRefine((value, context) => {
  const start = Date.parse(value.startsAt);
  if (Date.parse(value.registrationDeadline) > start) {
    context.addIssue({ code: "custom", message: "Deadline must precede the event.", path: ["registrationDeadline"] });
  }
  if (Date.parse(value.endsAt) <= start) {
    context.addIssue({ code: "custom", message: "End must follow start.", path: ["endsAt"] });
  }
});

export const eventTransitionSchema = z.object({
  clubId: z.uuid(),
  eventId: z.uuid(),
  newStatus: z.enum(["draft", "pending_approval", "published", "cancelled", "completed"]),
  reason: z.string().trim().max(1000),
}).superRefine((value, context) => {
  if (["draft", "cancelled"].includes(value.newStatus) && value.reason.length < 5) {
    context.addIssue({ code: "custom", message: "Reason is required.", path: ["reason"] });
  }
});

export const eventRegistrationSchema = z.object({ eventId: z.uuid() });
export const eventRegistrationCancellationSchema = z.object({ registrationId: z.uuid() });
export const attendanceSchema = z.object({
  clubId: z.uuid(),
  eventId: z.uuid(),
  registrationId: z.uuid(),
  status: z.enum(["attended", "no_show"]),
  reason: z.string().trim().min(5).max(500),
});
