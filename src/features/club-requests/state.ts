export type ClubRequestActionState = { message?: string; status: "idle" | "error" | "success" };
export const initialClubRequestActionState: ClubRequestActionState = { status: "idle" };
