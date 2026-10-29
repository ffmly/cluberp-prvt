export type UserStatusActionState = {
  fieldErrors?: { reason?: string };
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialUserStatusActionState: UserStatusActionState = {
  status: "idle",
};
