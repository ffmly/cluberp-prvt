import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/locales";

type LocaleSwitcherProps = {
  href: ComponentProps<typeof Link>["href"];
  locale: AppLocale;
};

export function LocaleSwitcher({ href, locale }: LocaleSwitcherProps) {
  const targetLocale = locale === "en" ? "ar" : "en";
  const label = locale === "en" ? "العربية" : "English";
  const accessibilityLabel =
    locale === "en" ? "Switch language to Arabic" : "غيّر اللغة إلى الإنجليزية";

  return (
    <Link
      aria-label={accessibilityLabel}
      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white/75 px-4 text-sm font-semibold text-[var(--text-strong)] shadow-sm backdrop-blur transition hover:border-teal-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      href={href}
      locale={targetLocale}
    >
      {label}
    </Link>
  );
}
