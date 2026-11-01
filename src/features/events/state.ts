export type EventActionState = {
  message?: string;
  status: "idle" | "success" | "error";
};

export const initialEventActionState: EventActionState = { status: "idle" };
