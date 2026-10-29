import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { OrganizationUnitForm } from "@/features/university-units/organization-unit-form";
import type { OrganizationUnitStatus } from "@/features/university-units/schemas";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const statusStyles = {
  active: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-200 text-slate-700",
  inactive: "bg-amber-100 text-amber-800",
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/universities/[universityId]">): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({
    locale,
    namespace: "UniversityOrganization",
  });
  return { title: t("title") };
}

export default async function UniversityOrganizationPage({
  params,
}: PageProps<"/[locale]/admin/universities/[universityId]">) {
  const { locale, universityId } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const supabase = await createClient();
  const [t, universityResult, campusResult, facultyResult, departmentResult] =
    await Promise.all([
      getTranslations({
        locale,
        namespace: "UniversityOrganization",
      }),
      supabase
        .from("universities")
        .select("id,name,slug,status")
        .eq("id", universityId)
        .maybeSingle(),
      supabase
        .from("campuses")
        .select("id,name,code,address,status,updated_at")
        .eq("university_id", universityId)
        .order("name"),
      supabase
        .from("faculties")
        .select("id,name,code,campus_id,status,updated_at")
        .eq("university_id", universityId)
        .order("name"),
      supabase
        .from("departments")
        .select("id,name,code,faculty_id,status,updated_at")
        .eq("university_id", universityId)
        .order("name"),
    ]);

  const university = universityResult.data;

  if (universityResult.error || !university) {
    notFound();
  }

  const campuses = campusResult.data ?? [];
  const faculties = facultyResult.data ?? [];
  const departments = departmentResult.data ?? [];
  const campusOptions = campuses.map(({ id, name }) => ({ id, name }));
  const facultyOptions = faculties.map(({ id, name }) => ({ id, name }));
  const campusNames = new Map(campuses.map(({ id, name }) => [id, name]));
  const facultyNames = new Map(faculties.map(({ id, name }) => [id, name]));
  const sharedCopy = {
    address: t("form.address"),
    addressPlaceholder: t("form.addressPlaceholder"),
    code: t("form.code"),
    codeHint: t("form.codeHint"),
    creating: t("form.creating"),
    name: t("form.name"),
    namePlaceholder: t("form.namePlaceholder"),
    noParents: t("form.noParents"),
    save: t("form.save"),
    saving: t("form.saving"),
    selectParent: t("form.selectParent"),
    status: t("form.status"),
    statuses: {
      active: t("statuses.active"),
      archived: t("statuses.archived"),
      inactive: t("statuses.inactive"),
    },
  };
  const copyByType = {
    campus: {
      ...sharedCopy,
      create: t("form.createCampus"),
      parent: t("form.campusParent"),
    },
    faculty: {
      ...sharedCopy,
      create: t("form.createFaculty"),
      parent: t("form.facultyParent"),
    },
    department: {
      ...sharedCopy,
      create: t("form.createDepartment"),
      parent: t("form.departmentParent"),
    },
  };
  const hasLoadError =
    campusResult.error || facultyResult.error || departmentResult.error;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
      <Link
        className="text-sm font-semibold text-teal-700 hover:text-teal-900"
        href="/admin/universities"
      >
        {t("backToUniversities")}
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
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
          href={`/admin/universities/${university.id}/staff`}
        >
          {t("manageStaff")}
        </Link>
      </section>

      {hasLoadError ? (
        <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
          {t("loadError")}
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-[var(--text-strong)]">
          {t("createTitle")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {t("createDescription")}
        </p>
        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          <CreateUnitCard title={t("campuses.newTitle")}>
            <OrganizationUnitForm
              copy={copyByType.campus}
              locale={locale}
              unitType="campus"
              universityId={university.id}
            />
          </CreateUnitCard>
          <CreateUnitCard title={t("faculties.newTitle")}>
            <OrganizationUnitForm
              copy={copyByType.faculty}
              locale={locale}
              parentOptions={campusOptions}
              unitType="faculty"
              universityId={university.id}
            />
          </CreateUnitCard>
          <CreateUnitCard title={t("departments.newTitle")}>
            <OrganizationUnitForm
              copy={copyByType.department}
              locale={locale}
              parentOptions={facultyOptions}
              unitType="department"
              universityId={university.id}
            />
          </CreateUnitCard>
        </div>
      </section>

      <section className="mt-14 space-y-12">
        <UnitGroup
          count={campuses.length}
          empty={t("campuses.empty")}
          title={t("campuses.title")}
        >
          {campuses.map((campus) => (
            <UnitCard
              code={campus.code}
              editLabel={t("edit")}
              key={campus.id}
              name={campus.name}
              status={campus.status as OrganizationUnitStatus}
              statusLabel={t(`statuses.${campus.status}`)}
            >
              <OrganizationUnitForm
                copy={copyByType.campus}
                locale={locale}
                unit={{
                  address: campus.address ?? undefined,
                  code: campus.code,
                  id: campus.id,
                  name: campus.name,
                  status: campus.status as OrganizationUnitStatus,
                }}
                unitType="campus"
                universityId={university.id}
              />
            </UnitCard>
          ))}
        </UnitGroup>

        <UnitGroup
          count={faculties.length}
          empty={t("faculties.empty")}
          title={t("faculties.title")}
        >
          {faculties.map((faculty) => (
            <UnitCard
              code={faculty.code}
              editLabel={t("edit")}
              key={faculty.id}
              name={faculty.name}
              parent={campusNames.get(faculty.campus_id)}
              status={faculty.status as OrganizationUnitStatus}
              statusLabel={t(`statuses.${faculty.status}`)}
            >
              <OrganizationUnitForm
                copy={copyByType.faculty}
                locale={locale}
                parentOptions={campusOptions}
                unit={{
                  code: faculty.code,
                  id: faculty.id,
                  name: faculty.name,
                  parentId: faculty.campus_id,
                  status: faculty.status as OrganizationUnitStatus,
                }}
                unitType="faculty"
                universityId={university.id}
              />
            </UnitCard>
          ))}
        </UnitGroup>

        <UnitGroup
          count={departments.length}
          empty={t("departments.empty")}
          title={t("departments.title")}
        >
          {departments.map((department) => (
            <UnitCard
              code={department.code}
              editLabel={t("edit")}
              key={department.id}
              name={department.name}
              parent={facultyNames.get(department.faculty_id)}
              status={department.status as OrganizationUnitStatus}
              statusLabel={t(`statuses.${department.status}`)}
            >
              <OrganizationUnitForm
                copy={copyByType.department}
                locale={locale}
                parentOptions={facultyOptions}
                unit={{
                  code: department.code,
                  id: department.id,
                  name: department.name,
                  parentId: department.faculty_id,
                  status: department.status as OrganizationUnitStatus,
                }}
                unitType="department"
                universityId={university.id}
              />
            </UnitCard>
          ))}
        </UnitGroup>
      </section>
    </div>
  );
}

function CreateUnitCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <article className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-semibold text-[var(--text-strong)]">
        {title}
      </h3>
      {children}
    </article>
  );
}

function UnitGroup({
  children,
  count,
  empty,
  title,
}: {
  children: ReactNode;
  count: number;
  empty: string;
  title: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-[var(--text-strong)]">{title}</h2>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--text-muted)] shadow-sm">
          {count}
        </span>
      </div>
      {count ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{children}</div>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-6 text-center text-sm text-[var(--text-muted)]">
          {empty}
        </p>
      )}
    </div>
  );
}

function UnitCard({
  children,
  code,
  editLabel,
  name,
  parent,
  status,
  statusLabel,
}: {
  children: ReactNode;
  code: string;
  editLabel: string;
  name: string;
  parent?: string;
  status: OrganizationUnitStatus;
  statusLabel: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[var(--text-strong)]">{name}</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]" dir="ltr">
            {code}
          </p>
          {parent ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">{parent}</p>
          ) : null}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {statusLabel}
        </span>
      </div>
      <details className="mt-5 border-t border-[var(--border-subtle)] pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-teal-700">
          {editLabel}
        </summary>
        <div className="mt-5">{children}</div>
      </details>
    </article>
  );
}
