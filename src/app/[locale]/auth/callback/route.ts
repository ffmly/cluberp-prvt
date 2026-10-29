import { NextResponse } from "next/server";

import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { getPublicEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

function getSafeDestination(value: string | null, locale: string) {
  const localeRoot = `/${locale}`;

  return value?.startsWith(`${localeRoot}/`) && !value.startsWith("//")
    ? value
    : `${localeRoot}/dashboard`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale: requestedLocale } = await context.params;
  const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const requestUrl = new URL(request.url);
  const appUrl = getPublicEnvironment().appUrl;
  const code = requestUrl.searchParams.get("code");
  const destination = getSafeDestination(
    requestUrl.searchParams.get("next"),
    locale,
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(destination, appUrl));
    }
  }

  return NextResponse.redirect(
    new URL(`/${locale}/login?status=confirmation-error`, appUrl),
  );
}
