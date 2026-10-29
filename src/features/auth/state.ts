export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"displayName" | "email" | "password", string>>;
};

export const initialAuthActionState: AuthActionState = {
  status: "idle",
};
