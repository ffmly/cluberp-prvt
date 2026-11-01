import { describe, expect, it } from "vitest";

import {
  assignClubRoleSchema,
  clubCandidateSchema,
  clubTeamSchema,
  revokeClubRoleSchema,
} from "./schemas";

const clubId = "ac000000-0000-4000-8000-000000000001";

describe("club workspace schemas", () => {
  it("normalizes valid team input", () => {
    expect(
      clubTeamSchema.parse({
        clubId,
        description: "  Plans workshops.  ",
        name: "  Programs  ",
        teamId: "",
      }),
    ).toEqual({
      clubId,
      description: "Plans workshops.",
      name: "Programs",
      teamId: undefined,
    });
  });

  it("rejects invalid team and leadership input", () => {
    expect(clubTeamSchema.safeParse({ clubId, description: "", name: "x" }).success).toBe(false);
    expect(clubCandidateSchema.safeParse({ clubId, email: "not-an-email" }).success).toBe(false);
    expect(assignClubRoleSchema.safeParse({ clubId, roleId: "bad", userId: "bad" }).success).toBe(false);
    expect(revokeClubRoleSchema.safeParse({ assignmentId: clubId, clubId, reason: "no" }).success).toBe(false);
  });
});
