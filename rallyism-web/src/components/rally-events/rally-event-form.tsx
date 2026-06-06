import Link from "next/link";
import type { ReactNode } from "react";

import type { RallyEventSummary } from "@/services/rally-events";

type RallyEventFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  currentUserIsAdmin: boolean;
  error?: string;
  event?: RallyEventSummary;
  eventId?: number;
  submitLabel: string;
  cancelHref: string;
};

const championships = [
  { value: "WRC", label: "WRC" },
  { value: "ERC", label: "ERC" },
  { value: "national", label: "National rally" },
  { value: "other", label: "Other" },
];

const visibilities = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
];

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
const textareaClass =
  "min-h-32 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

export function RallyEventForm({
  action,
  currentUserIsAdmin,
  error,
  event,
  eventId,
  submitLabel,
  cancelHref,
}: RallyEventFormProps) {
  return (
    <form action={action} className="space-y-6">
      {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title">
          <input
            className={inputClass}
            defaultValue={event?.title}
            maxLength={180}
            name="title"
            required
          />
        </Field>

        <Field label="Rally name">
          <input
            className={inputClass}
            defaultValue={event?.rallyName}
            maxLength={180}
            name="rallyName"
            required
          />
        </Field>

        <Field label="Championship">
          <select
            className={inputClass}
            defaultValue={event?.championship ?? "other"}
            name="championship"
          >
            {championships.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Season year">
          <input
            className={inputClass}
            defaultValue={event?.seasonYear ?? new Date().getFullYear()}
            max={new Date().getFullYear() + 2}
            min={1950}
            name="seasonYear"
            required
            type="number"
          />
        </Field>

        <Field label="Country">
          <input
            className={inputClass}
            defaultValue={event?.country}
            maxLength={120}
            name="country"
            required
          />
        </Field>

        <Field label="Region / location">
          <input
            className={inputClass}
            defaultValue={event?.region ?? ""}
            maxLength={180}
            name="region"
          />
        </Field>

        <Field label="Start date">
          <input
            className={inputClass}
            defaultValue={event?.startDate ?? ""}
            name="startDate"
            type="date"
          />
        </Field>

        <Field label="End date">
          <input
            className={inputClass}
            defaultValue={event?.endDate ?? ""}
            name="endDate"
            type="date"
          />
        </Field>

        <Field label="Cover image URL">
          <input
            className={inputClass}
            defaultValue={event?.coverImageUrl ?? ""}
            name="coverImageUrl"
            type="url"
          />
        </Field>

        <Field label="Visibility">
          <select
            className={inputClass}
            defaultValue={event?.visibility ?? "private"}
            name="visibility"
          >
            {visibilities.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          className={textareaClass}
          defaultValue={event?.description ?? ""}
          name="description"
        />
      </Field>

      {currentUserIsAdmin ? (
        <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
          <input
            className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
            defaultChecked={event?.featured ?? false}
            name="featured"
            type="checkbox"
          />
          <span className="text-sm font-semibold text-zinc-900">Featured</span>
        </label>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
