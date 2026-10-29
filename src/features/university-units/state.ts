export type OrganizationUnitField =
  | "address"
  | "code"
  | "name"
  | "parentId"
  | "status";

export type OrganizationUnitActionState = {
  fieldErrors?: Partial<Record<OrganizationUnitField, string>>;
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialOrganizationUnitActionState: OrganizationUnitActionState = {
  status: "idle",
};
