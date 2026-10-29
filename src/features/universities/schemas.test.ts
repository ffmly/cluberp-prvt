import { describe, expect, it } from "vitest";

import { universityFormSchema } from "./schemas";

describe("universityFormSchema", () => {
  const validUniversity = {
    defaultCurrency: "dzd",
    defaultLocale: "ar",
    defaultTimeZone: "Africa/Algiers",
    intent: "create",
    name: " Example University ",
    slug: "example-university",
    status: "draft",
  };

  it("normalizes valid university input", () => {
    const result = universityFormSchema.parse(validUniversity);

    expect(result.name).toBe("Example University");
    expect(result.defaultCurrency).toBe("DZD");
  });

  it("rejects invalid slugs and time zones", () => {
    const result = universityFormSchema.safeParse({
      ...validUniversity,
      defaultTimeZone: "Mars/Olympus",
      slug: "Not a slug",
    });

    expect(result.success).toBe(false);
  });

  it("requires a university identifier for updates", () => {
    const result = universityFormSchema.safeParse({
      ...validUniversity,
      intent: "update",
    });

    expect(result.success).toBe(false);
  });
});
