export const locales = ["en", "ar"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && locales.some((locale) => locale === value);
}

export function getTextDirection(locale: AppLocale) {
  return locale === "ar" ? "rtl" : "ltr";
}
