import { describe, expect, it } from "vitest";

import { attendanceSchema, eventSchema, eventTransitionSchema } from "./schemas";

const base = { capacity: "20", clubId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", description: "A useful student workshop.", eligibility: "authenticated", endsAt: "2030-02-01T12:00", eventId: "", eventType: "workshop", location: "Main lab", registrationDeadline: "2030-01-30T10:00", startsAt: "2030-02-01T10:00", title: "Robotics workshop", visibility: "public" };

describe("event schemas", () => {
  it("normalizes a valid event payload", () => expect(eventSchema.parse(base).capacity).toBe(20));
  it("rejects an end before the start", () => expect(eventSchema.safeParse({ ...base, endsAt: "2030-02-01T09:00" }).success).toBe(false));
  it("requires a cancellation reason", () => expect(eventTransitionSchema.safeParse({ clubId: base.clubId, eventId: base.clubId, newStatus: "cancelled", reason: "" }).success).toBe(false));
  it("validates attendance corrections", () => expect(attendanceSchema.safeParse({ clubId: base.clubId, eventId: base.clubId, registrationId: base.clubId, status: "attended", reason: "Desk check-in" }).success).toBe(true));
});
