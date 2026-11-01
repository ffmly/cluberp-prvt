export type MembershipActionState = {
  invitationPath?: string;
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialMembershipActionState: MembershipActionState = {
  status: "idle",
};
