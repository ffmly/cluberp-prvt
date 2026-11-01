export type OperationState = { message?: string; status: "idle" | "success" | "error" };
export const initialOperationState: OperationState = { status: "idle" };
