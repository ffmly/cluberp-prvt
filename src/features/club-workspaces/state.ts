export type ClubWorkspaceActionState = {
  message?: string;
  status: "idle" | "success" | "error";
};

export type ClubCandidate = {
  displayName: string;
  email: string;
  userId: string;
};

export type ClubCandidateActionState = ClubWorkspaceActionState & {
  candidate?: ClubCandidate;
};

export const initialClubWorkspaceActionState: ClubWorkspaceActionState = {
  status: "idle",
};

export const initialClubCandidateActionState: ClubCandidateActionState = {
  status: "idle",
};
