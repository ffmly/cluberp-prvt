export type UniversityField =
  | "name"
  | "slug"
  | "status"
  | "defaultLocale"
  | "defaultTimeZone"
  | "defaultCurrency";

export type UniversityActionState = {
  fieldErrors?: Partial<Record<UniversityField, string>>;
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialUniversityActionState: UniversityActionState = {
  status: "idle",
};
