import { describe, expect, it } from "vitest";

import { userStatusFormSchema } from "./schemas";

describe("userStatusFormSchema", () => {
  it("normalizes a valid suspension reason", () => {
    const result = userStatusFormSchema.parse({
      newStatus: "suspended",
      reason: "  Repeated policy violation  ",
      targetUserId: "72222222-2222-4222-8222-222222222222",
    });
    expect(result.reason).toBe("Repeated policy violation");
  });

  it("rejects status changes without an adequate reason", () => {
    expect(
      userStatusFormSchema.safeParse({
        newStatus: "active",
        reason: "no",
        targetUserId: "72222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(false);
  });
});
