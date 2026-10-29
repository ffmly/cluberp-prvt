import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "./schemas";

describe("authentication schemas", () => {
  it("normalizes email addresses before sign in", () => {
    const result = signInSchema.parse({
      email: "  MEMBER@UNIVERSITY.EDU ",
      password: "a-secure-password",
    });

    expect(result.email).toBe("member@university.edu");
  });

  it("rejects short passwords", () => {
    const result = signInSchema.safeParse({
      email: "member@university.edu",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("trims a valid sign-up display name", () => {
    const result = signUpSchema.parse({
      displayName: "  Ada Lovelace  ",
      email: "ada@university.edu",
      password: "a-secure-password",
    });

    expect(result.displayName).toBe("Ada Lovelace");
  });
});
