"use client";

import { useActionState, useState } from "react";
import type { AppLocale } from "@/i18n/locales";
import { submitClubRequestAction, transitionClubRequestAction } from "./actions";
import { initialClubRequestActionState } from "./state";

type Copy = { approve: string; approving: string; club: string; create: string; description: string; name: string; reason: string; reject: string; rejecting: string; renewal: string; review: string; reviewing: string; slug: string; submit: string; submitting: string; type: string; university: string };
type Option = { id: string; name: string; universityId?: string; slug?: string; description?: string };

function Feedback({ message, status }: { message?: string; status: string }) {
  return message ? <p className={`rounded-xl border px-4 py-3 text-sm ${status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`} role={status === "error" ? "alert" : "status"}>{message}</p> : null;
}

export function ClubRequestForm({ clubs, copy, locale, universities }: { clubs: Option[]; copy: Copy; locale: AppLocale; universities: Option[] }) {
  const [state, action, pending] = useActionState(submitClubRequestAction, initialClubRequestActionState);
  const [type, setType] = useState<"create" | "renewal">("create");
  const [clubId, setClubId] = useState("");
  const selectedClub = clubs.find((club) => club.id === clubId);
  return <form action={action} className="space-y-5" noValidate><input name="locale" type="hidden" value={locale} /><div className="grid gap-4 md:grid-cols-2"><Select id="request-type" label={copy.type} name="requestType" onChange={(value) => { setType(value as "create" | "renewal"); setClubId(""); }} options={[{ id: "create", name: copy.create }, { id: "renewal", name: copy.renewal }]} value={type} />{type === "renewal" ? <Select id="request-club" label={copy.club} name="clubId" onChange={setClubId} options={clubs} value={clubId} /> : <Select id="request-university" label={copy.university} name="universityId" options={universities} />}</div>{type === "renewal" && selectedClub ? <input name="universityId" type="hidden" value={selectedClub.universityId} /> : null}<div className="grid gap-4 md:grid-cols-2"><Field defaultValue={selectedClub?.name} id="request-name" key={`name-${selectedClub?.id ?? "create"}`} label={copy.name} name="name" /><Field defaultValue={selectedClub?.slug} id="request-slug" key={`slug-${selectedClub?.id ?? "create"}`} label={copy.slug} name="slug" /></div><div><label className="mb-2 block text-sm font-semibold" htmlFor="request-description">{copy.description}</label><textarea className="min-h-28 w-full rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm" defaultValue={selectedClub?.description} id="request-description" key={`description-${selectedClub?.id ?? "create"}`} maxLength={5000} name="description" /></div><Feedback message={state.message} status={state.status} /><button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending || (type === "renewal" && !selectedClub)} type="submit">{pending ? copy.submitting : copy.submit}</button></form>;
}

function Field({ defaultValue, id, label, name }: { defaultValue?: string; id: string; label: string; name: string }) { return <div><label className="mb-2 block text-sm font-semibold" htmlFor={id}>{label}</label><input className="h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" defaultValue={defaultValue} id={id} name={name} required /></div>; }
function Select({ id, label, name, onChange, options, value }: { id: string; label: string; name: string; onChange?: (value: string) => void; options: Option[]; value?: string }) { return <div><label className="mb-2 block text-sm font-semibold" htmlFor={id}>{label}</label><select className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm" defaultValue={value === undefined ? options[0]?.id : undefined} id={id} name={name} onChange={onChange ? (event) => onChange(event.target.value) : undefined} value={value}>{value !== undefined ? <option value="">—</option> : null}{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></div>; }

export function ClubReviewForm({ copy, locale, requestId, status }: { copy: Copy; locale: AppLocale; requestId: string; status: string }) {
  const [state, action, pending] = useActionState(transitionClubRequestAction, initialClubRequestActionState);
  const inReview = status === "under_review";
  return <form action={action} className="space-y-4"><input name="locale" type="hidden" value={locale} /><input name="requestId" type="hidden" value={requestId} />{inReview ? <div><label className="mb-2 block text-sm font-semibold" htmlFor={`decision-${requestId}`}>{copy.reason}</label><textarea className="min-h-20 w-full rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm" id={`decision-${requestId}`} maxLength={1000} name="reason" /></div> : <input name="reason" type="hidden" value="" />}<Feedback message={state.message} status={state.status} /><div className="flex flex-wrap gap-3">{inReview ? <><button className="min-h-11 rounded-xl bg-teal-800 px-5 text-sm font-semibold text-white" name="newStatus" type="submit" value="approved">{pending ? copy.approving : copy.approve}</button><button className="min-h-11 rounded-xl bg-rose-700 px-5 text-sm font-semibold text-white" name="newStatus" type="submit" value="rejected">{pending ? copy.rejecting : copy.reject}</button></> : <button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white" name="newStatus" type="submit" value="under_review">{pending ? copy.reviewing : copy.review}</button>}</div></form>;
}
