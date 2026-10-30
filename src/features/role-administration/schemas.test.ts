import { describe, expect, it } from "vitest";
import { roleFormSchema, roleLifecycleSchema } from "./schemas";

describe("role administration schemas", () => {
  it("normalizes a custom role", () => {
    const result = roleFormSchema.parse({ description: "  Reviews access  ", key: "Access_Reviewer", name: " Access Reviewer ", permissionKeys: ["platform.roles_manage"], roleId: null });
    expect(result).toMatchObject({ description: "Reviews access", key: "access_reviewer", name: "Access Reviewer" });
  });
  it("requires at least one permission", () => expect(roleFormSchema.safeParse({ description: "", key: "empty_role", name: "Empty Role", permissionKeys: [] }).success).toBe(false));
  it("requires a reason for lifecycle changes", () => expect(roleLifecycleSchema.safeParse({ intent: "archive", reason: "no", targetId: "81111111-1111-4111-8111-111111111111" }).success).toBe(false));
});
