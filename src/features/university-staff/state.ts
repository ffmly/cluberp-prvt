export type StaffAssignmentField =
  | "email"
  | "scopeId"
  | "scopeType"
  | "staffType"
  | "status"
  | "title";

export type StaffAssignmentActionState = {
  fieldErrors?: Partial<Record<StaffAssignmentField, string>>;
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialStaffAssignmentActionState: StaffAssignmentActionState = {
  status: "idle",
};
