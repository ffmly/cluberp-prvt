import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./locales";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: {
    name: "CLUB_ERP_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});
