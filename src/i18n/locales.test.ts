import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  getTextDirection,
  isAppLocale,
  locales,
} from "./locales";

describe("locale configuration", () => {
  it("keeps the default locale in the supported locale catalog", () => {
    expect(locales).toContain(defaultLocale);
  });

  it.each([
    ["en", true],
    ["ar", true],
    ["fr", false],
    [null, false],
  ])("validates %s", (value, expected) => {
    expect(isAppLocale(value)).toBe(expected);
  });

  it("maps Arabic to RTL and English to LTR", () => {
    expect(getTextDirection("ar")).toBe("rtl");
    expect(getTextDirection("en")).toBe("ltr");
  });
});
