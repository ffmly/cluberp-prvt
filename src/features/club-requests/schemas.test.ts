import { describe, expect, it } from "vitest";
import { clubRequestSchema, clubRequestTransitionSchema } from "./schemas";

describe("club request schemas", () => {
  const request = { clubId: null, description: " Robotics ", name: " Robotics Club ", requestType: "create", slug: "Robotics-Club", universityId: "9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1" };
  it("normalizes a creation request", () => expect(clubRequestSchema.parse(request)).toMatchObject({ description: "Robotics", name: "Robotics Club", slug: "robotics-club" }));
  it("requires a club for renewal", () => expect(clubRequestSchema.safeParse({ ...request, requestType: "renewal" }).success).toBe(false));
  it("requires a rejection reason", () => expect(clubRequestTransitionSchema.safeParse({ newStatus: "rejected", reason: "", requestId: "91111111-1111-4111-8111-111111111111" }).success).toBe(false));
});
