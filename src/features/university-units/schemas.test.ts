import { describe, expect, it } from "vitest";

import { organizationUnitFormSchema } from "./schemas";

describe("organizationUnitFormSchema", () => {
  const validCampus = {
    address: " Algiers ",
    code: "main-1",
    intent: "create",
    name: " Main Campus ",
    parentId: null,
    status: "active",
    unitId: null,
    unitType: "campus",
    universityId: "11111111-1111-4111-8111-111111111111",
  };

  it("normalizes valid unit input", () => {
    const result = organizationUnitFormSchema.parse(validCampus);

    expect(result.code).toBe("MAIN-1");
    expect(result.name).toBe("Main Campus");
    expect(result.address).toBe("Algiers");
  });

  it("requires a parent for faculties and departments", () => {
    const result = organizationUnitFormSchema.safeParse({
      ...validCampus,
      unitType: "faculty",
    });

    expect(result.success).toBe(false);
  });

  it("requires a unit identifier for updates", () => {
    const result = organizationUnitFormSchema.safeParse({
      ...validCampus,
      intent: "update",
    });

    expect(result.success).toBe(false);
  });
});
