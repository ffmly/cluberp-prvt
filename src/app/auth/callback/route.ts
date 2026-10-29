import { NextResponse } from "next/server";

import { getPublicEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

function getSafeDestination(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appUrl = getPublicEnvironment().appUrl;
  const code = requestUrl.searchParams.get("code");
  const destination = getSafeDestination(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const flowId = requestUrl.searchParams.get("sb_flow_id");
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (!error) {
      return NextResponse.redirect(new URL(destination, appUrl));
    }
  }

  return NextResponse.redirect(
    new URL("/login?status=confirmation-error", appUrl),
  );
}
