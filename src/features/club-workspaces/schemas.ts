import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.uuid().optional(),
);

export const clubTeamSchema = z.object({
  clubId: z.uuid(),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => value || undefined),
  name: z.string().trim().min(2).max(120),
  teamId: optionalUuid,
});

export const archiveClubTeamSchema = z.object({
  clubId: z.uuid(),
  teamId: z.uuid(),
});

export const clubCandidateSchema = z.object({
  clubId: z.uuid(),
  email: z.email().trim().toLowerCase().max(320),
});

export const assignClubRoleSchema = z.object({
  clubId: z.uuid(),
  roleId: z.uuid(),
  userId: z.uuid(),
});

export const revokeClubRoleSchema = z.object({
  assignmentId: z.uuid(),
  clubId: z.uuid(),
  reason: z.string().trim().min(5).max(500),
});
