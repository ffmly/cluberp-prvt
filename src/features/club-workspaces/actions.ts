"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

import {
  archiveClubTeamSchema,
  assignClubRoleSchema,
  clubCandidateSchema,
  clubTeamSchema,
  revokeClubRoleSchema,
} from "./schemas";
import type {
  ClubCandidateActionState,
  ClubWorkspaceActionState,
} from "./state";

function getLocale(formData: FormData) {
  const locale = formData.get("locale");
  return isAppLocale(locale) ? locale : defaultLocale;
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return {
    authenticated: !error && typeof data?.claims?.sub === "string",
    supabase,
  };
}

export async function saveClubTeamAction(
  _state: ClubWorkspaceActionState,
  formData: FormData,
): Promise<ClubWorkspaceActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "ClubWorkspace" });
  const parsed = clubTeamSchema.safeParse({
    clubId: formData.get("clubId"),
    description: formData.get("description") ?? "",
    name: formData.get("name"),
    teamId: formData.get("teamId"),
  });

  if (!parsed.success) {
    return { message: t("errors.checkFields"), status: "error" };
  }

  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) {
    return { message: t("errors.sessionExpired"), status: "error" };
  }

  const { error } = await supabase.rpc("save_club_team", {
    target_club_id: parsed.data.clubId,
    target_team_id: (parsed.data.teamId ?? null) as unknown as string,
    team_description: parsed.data.description ?? "",
    team_name: parsed.data.name,
  });

  if (error) {
    return {
      message:
        error.code === "23505"
          ? t("errors.teamDuplicate")
          : error.code === "42501"
            ? t("errors.notAuthorized")
            : t("errors.saveFailed"),
      status: "error",
    };
  }

  revalidatePath(`/${locale}/dashboard/clubs/${parsed.data.clubId}`);
  return {
    message: parsed.data.teamId ? t("teamUpdated") : t("teamCreated"),
    status: "success",
  };
}

export async function archiveClubTeamAction(
  _state: ClubWorkspaceActionState,
  formData: FormData,
): Promise<ClubWorkspaceActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "ClubWorkspace" });
  const parsed = archiveClubTeamSchema.safeParse({
    clubId: formData.get("clubId"),
    teamId: formData.get("teamId"),
  });
  if (!parsed.success) {
    return { message: t("errors.checkFields"), status: "error" };
  }

  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) {
    return { message: t("errors.sessionExpired"), status: "error" };
  }
  const { error } = await supabase.rpc("archive_club_team", {
    target_club_id: parsed.data.clubId,
    target_team_id: parsed.data.teamId,
  });
  if (error) {
    return { message: t("errors.lifecycleFailed"), status: "error" };
  }

  revalidatePath(`/${locale}/dashboard/clubs/${parsed.data.clubId}`);
  return { message: t("teamArchived"), status: "success" };
}

export async function lookupClubCandidateAction(
  _state: ClubCandidateActionState,
  formData: FormData,
): Promise<ClubCandidateActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "ClubWorkspace" });
  const parsed = clubCandidateSchema.safeParse({
    clubId: formData.get("clubId"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { message: t("errors.emailInvalid"), status: "error" };
  }

  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) {
    return { message: t("errors.sessionExpired"), status: "error" };
  }
  const { data, error } = await supabase.rpc("lookup_club_role_candidate", {
    email_query: parsed.data.email,
    target_club_id: parsed.data.clubId,
  });
  const candidate = data?.[0];
  if (error || !candidate) {
    return { message: t("errors.userNotFound"), status: "error" };
  }
  return {
    candidate: {
      displayName: candidate.display_name,
      email: candidate.email,
      userId: candidate.user_id,
    },
    message: t("candidateFound"),
    status: "success",
  };
}

export async function assignClubRoleAction(
  _state: ClubWorkspaceActionState,
  formData: FormData,
): Promise<ClubWorkspaceActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "ClubWorkspace" });
  const parsed = assignClubRoleSchema.safeParse({
    clubId: formData.get("clubId"),
    roleId: formData.get("roleId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { message: t("errors.checkFields"), status: "error" };
  }

  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) {
    return { message: t("errors.sessionExpired"), status: "error" };
  }
  const { error } = await supabase.rpc("assign_club_role", {
    target_club_id: parsed.data.clubId,
    target_role_id: parsed.data.roleId,
    target_user_id: parsed.data.userId,
  });
  if (error) {
    return {
      message:
        error.code === "23505"
          ? t("errors.roleDuplicate")
          : t("errors.assignFailed"),
      status: "error",
    };
  }

  revalidatePath(`/${locale}/dashboard/clubs/${parsed.data.clubId}`);
  return { message: t("roleAssigned"), status: "success" };
}

export async function revokeClubRoleAction(
  _state: ClubWorkspaceActionState,
  formData: FormData,
): Promise<ClubWorkspaceActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "ClubWorkspace" });
  const parsed = revokeClubRoleSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    clubId: formData.get("clubId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { message: t("errors.reasonInvalid"), status: "error" };
  }

  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) {
    return { message: t("errors.sessionExpired"), status: "error" };
  }
  const { error } = await supabase.rpc("revoke_club_role", {
    reason: parsed.data.reason,
    target_assignment_id: parsed.data.assignmentId,
    target_club_id: parsed.data.clubId,
  });
  if (error) {
    return {
      message:
        error.code === "23514"
          ? t("errors.lastPresident")
          : t("errors.lifecycleFailed"),
      status: "error",
    };
  }

  revalidatePath(`/${locale}/dashboard/clubs/${parsed.data.clubId}`);
  return { message: t("roleRevoked"), status: "success" };
}
