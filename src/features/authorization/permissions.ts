import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type PermissionScope =
  | { type: "platform" }
  | { id: string; type: "university" | "club" | "team" };

export async function currentUserHasPermission(
  supabase: SupabaseClient<Database>,
  permissionKey: string,
  scope: PermissionScope,
) {
  const { data, error } = await supabase.rpc("current_user_has_permission", {
    permission_key: permissionKey,
    scope_type: scope.type,
    ...(scope.type === "platform" ? {} : { scope_id: scope.id }),
  });

  return {
    allowed: data === true && !error,
    error,
  };
}
