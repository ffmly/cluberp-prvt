import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnvironment } from "@/lib/env/public";

export function createClient() {
  const environment = getPublicEnvironment();

  return createBrowserClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
  );
}
