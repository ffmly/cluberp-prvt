import { describe, expect, it } from "vitest";

import { staffAssignmentFormSchema } from "./schemas";

describe("staffAssignmentFormSchema", () => {
  const validAssignment = {
    email: " Staff@Example.test ",
    intent: "create",
    scopeId: null,
    scopeType: "university",
    staffType: "administrator",
    status: "active",
    title: " University Administrator ",
    universityId: "11111111-1111-4111-8111-111111111111",
  };

  it("normalizes a valid university assignment", () => {
    const result = staffAssignmentFormSchema.parse(validAssignment);

    expect(result).toMatchObject({
      email: "staff@example.test",
      intent: "create",
    });
    expect(result.title).toBe("University Administrator");
  });

  it("requires a unit for scoped assignments", () => {
    const result = staffAssignmentFormSchema.safeParse({
      ...validAssignment,
      scopeType: "department",
    });

    expect(result.success).toBe(false);
  });

  it("does not allow creating an already ended assignment", () => {
    const result = staffAssignmentFormSchema.safeParse({
      ...validAssignment,
      status: "ended",
    });

    expect(result.success).toBe(false);
  });
});
