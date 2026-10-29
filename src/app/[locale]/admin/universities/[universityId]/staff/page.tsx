import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  StaffAssignmentForm,
  type StaffAssignmentFormValues,
} from "@/features/university-staff/staff-assignment-form";
import type {
  StaffAssignmentStatus,
  StaffScopeType,
  StaffType,
} from "@/features/university-staff/schemas";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const statusStyles: Record<StaffAssignmentStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  ended: "bg-slate-200 text-slate-700",
  invited: "bg-sky-100 text-sky-800",
  suspended: "bg-rose-100 text-rose-800",
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/universities/[universityId]/staff">): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "UniversityStaff" });
  return { title: t("title") };
}

export default async function UniversityStaffPage({
  params,
}: PageProps<"/[locale]/admin/universities/[universityId]/staff">) {
  const { locale, universityId } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const supabase = await createClient();
  const [
    t,
    universityResult,
    campusResult,
    facultyResult,
    departmentResult,
    staffResult,
  ] = await Promise.all([
    getTranslations({ locale, namespace: "UniversityStaff" }),
    supabase
      .from("universities")
      .select("id,name")
      .eq("id", universityId)
      .maybeSingle(),
    supabase
      .from("campuses")
      .select("id,name")
      .eq("university_id", universityId)
      .order("name"),
    supabase
      .from("faculties")
      .select("id,name")
      .eq("university_id", universityId)
      .order("name"),
    supabase
      .from("departments")
      .select("id,name")
      .eq("university_id", universityId)
      .order("name"),
    supabase.rpc("list_university_staff", {
      target_university_id: universityId,
    }),
  ]);
  const university = universityResult.data;

  if (universityResult.error || !university) {
    notFound();
  }

  const campuses = campusResult.data ?? [];
  const faculties = facultyResult.data ?? [];
  const departments = departmentResult.data ?? [];
  const scopeNames = new Map<string, string>([
    ...campuses.map((unit) => [unit.id, unit.name] as const),
    ...faculties.map((unit) => [unit.id, unit.name] as const),
    ...departments.map((unit) => [unit.id, unit.name] as const),
  ]);
  const copy = {
    create: t("form.create"),
    creating: t("form.creating"),
    email: t("form.email"),
    emailHint: t("form.emailHint"),
    emailPlaceholder: t("form.emailPlaceholder"),
    noScopeOptions: t("form.noScopeOptions"),
    save: t("form.save"),
    saving: t("form.saving"),
    scope: t("form.scope"),
    scopeTypes: {
      campus: t("scopeTypes.campus"),
      department: t("scopeTypes.department"),
      faculty: t("scopeTypes.faculty"),
      university: t("scopeTypes.university"),
    },
    selectScope: t("form.selectScope"),
    staffType: t("form.staffType"),
    staffTypes: {
      administrator: t("staffTypes.administrator"),
      other: t("staffTypes.other"),
      reviewer: t("staffTypes.reviewer"),
      supervisor: t("staffTypes.supervisor"),
    },
    status: t("form.status"),
    statuses: {
      active: t("statuses.active"),
      ended: t("statuses.ended"),
      invited: t("statuses.invited"),
      suspended: t("statuses.suspended"),
    },
    title: t("form.title"),
    titlePlaceholder: t("form.titlePlaceholder"),
  };
  const assignments = staffResult.data ?? [];
  const hasLoadError =
    campusResult.error ||
    facultyResult.error ||
    departmentResult.error ||
    staffResult.error;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
      <Link
        className="text-sm font-semibold text-teal-700 hover:text-teal-900"
        href={`/admin/universities/${university.id}`}
      >
        {t("backToOrganization")}
      </Link>

      <section className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[var(--text-strong)] sm:text-5xl">
          {university.name}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">
          {t("description")}
        </p>
      </section>

      {hasLoadError ? (
        <p
          className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
          role="alert"
        >
          {t("loadError")}
        </p>
      ) : null}

      <section className="mt-10 rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">
          {t("newTitle")}
        </h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {t("newDescription")}
        </p>
        <StaffAssignmentForm
          copy={copy}
          locale={locale}
          scopeOptions={{
            campus: campuses,
            department: departments,
            faculty: faculties,
          }}
          universityId={university.id}
        />
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[var(--text-strong)]">
            {t("existingTitle")}
          </h2>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--text-muted)] shadow-sm">
            {t("count", { count: assignments.length })}
          </span>
        </div>

        {assignments.length ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {assignments.map((assignment) => {
              const status = assignment.status as StaffAssignmentStatus;
              const staffType = assignment.staff_type as StaffType;
              const scopeType = assignment.scope_type as StaffScopeType;
              const values: StaffAssignmentFormValues = {
                id: assignment.assignment_id,
                staffType,
                status,
                title: assignment.title ?? undefined,
              };
              const scopeName =
                scopeType === "university"
                  ? university.name
                  : scopeNames.get(assignment.scope_id ?? "") ??
                    t(`scopeTypes.${scopeType}`);

              return (
                <article
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm"
                  key={assignment.assignment_id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-[var(--text-strong)]">
                        {assignment.display_name || assignment.email}
                      </h3>
                      <p className="mt-1 truncate text-sm text-[var(--text-muted)]" dir="ltr">
                        {assignment.email}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
                      {t(`statuses.${status}`)}
                    </span>
                  </div>
                  <dl className="mt-5 grid gap-3 border-t border-[var(--border-subtle)] pt-5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        {t("scopeLabel")}
                      </dt>
                      <dd className="mt-1 font-medium text-[var(--text-strong)]">{scopeName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        {t("staffTypeLabel")}
                      </dt>
                      <dd className="mt-1 font-medium text-[var(--text-strong)]">
                        {t(`staffTypes.${staffType}`)}
                      </dd>
                    </div>
                    {assignment.title ? (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                          {t("titleLabel")}
                        </dt>
                        <dd className="mt-1 font-medium text-[var(--text-strong)]">
                          {assignment.title}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <details className="mt-5 border-t border-[var(--border-subtle)] pt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-teal-700">
                      {t("edit")}
                    </summary>
                    <div className="mt-5">
                      <StaffAssignmentForm
                        assignment={values}
                        copy={copy}
                        locale={locale}
                        scopeOptions={{ campus: [], department: [], faculty: [] }}
                        universityId={university.id}
                      />
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-8 text-center text-[var(--text-muted)]">
            {t("empty")}
          </p>
        )}
      </section>
    </div>
  );
}
