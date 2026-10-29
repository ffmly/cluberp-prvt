import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const handleInternationalizedRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const authResponse = await updateSession(request);
  const response = handleInternationalizedRouting(request);

  for (const cookie of authResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  return response;
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
