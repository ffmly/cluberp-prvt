import { describe, expect, it } from "vitest";

import {
  invitationSchema,
  membershipApplicationSchema,
  membershipStatusSchema,
} from "./schemas";

const clubId = "bc000000-0000-4000-8000-000000000001";

describe("membership schemas", () => {
  it("normalizes a join application", () => {
    expect(membershipApplicationSchema.parse({
      applicationType: "join",
      clubId,
      interests: "  workshops  ",
      membershipId: "",
      motivation: "  I want to contribute to student workshops.  ",
    })).toEqual({
      applicationType: "join",
      clubId,
      interests: "workshops",
      membershipId: undefined,
      motivation: "I want to contribute to student workshops.",
    });
  });

  it("requires renewal context and valid management input", () => {
    expect(membershipApplicationSchema.safeParse({ applicationType: "renewal", clubId, interests: "", membershipId: "", motivation: "A valid renewal motivation." }).success).toBe(false);
    expect(invitationSchema.safeParse({ clubId, email: "bad" }).success).toBe(false);
    expect(membershipStatusSchema.safeParse({ clubId, membershipId: clubId, newStatus: "removed", reason: "no" }).success).toBe(false);
  });
});
