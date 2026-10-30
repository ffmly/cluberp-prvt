export type RoleActionState = {
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialRoleActionState: RoleActionState = { status: "idle" };
