import Link from "next/link";
import type { ReactNode } from "react";

import { DateTextInput } from "@/components/ui/date-text-input";
import { formatDateForDisplay } from "@/services/rally-events";
import type { RallyEventSummary } from "@/services/rally-events";

type RallyEventFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  currentUserIsAdmin: boolean;
  deleteAction?: (formData: FormData) => void | Promise<void>;
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
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "unlisted", label: "Unlisted" },
];

function Field({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-zinc-900">
        {label}
        {required ? (
          <span className="ml-1 text-rally-orange" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue/20";
const textareaClass =
  "min-h-32 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue/20";

export function RallyEventForm({
  action,
  currentUserIsAdmin,
  deleteAction,
  error,
  event,
  eventId,
  submitLabel,
  cancelHref,
}: RallyEventFormProps) {
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" required>
          <input
            className={inputClass}
            defaultValue={event?.title}
            maxLength={180}
            name="title"
            required
          />
        </Field>

        <Field label="Rally name" required>
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

        <Field label="Season year" required>
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

        <Field label="Country" required>
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
          <DateTextInput
            className={inputClass}
            defaultValue={formatDateForDisplay(event?.startDate)}
            name="startDate"
          />
        </Field>

        <Field label="End date">
          <DateTextInput
            className={inputClass}
            defaultValue={formatDateForDisplay(event?.endDate)}
            name="endDate"
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
            defaultValue={event?.visibility ?? "public"}
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
              className="h-4 w-4 rounded border-zinc-300 text-rally-blue focus:ring-rally-blue"
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
            className="inline-flex h-11 items-center justify-center rounded-md bg-rally-blue px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
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

      {deleteAction && eventId ? (
        <form action={deleteAction} className="border-t border-zinc-200 pt-6">
          <input type="hidden" name="eventId" value={eventId} />
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h2 className="text-base font-semibold text-red-900">
              Delete rally event
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              This permanently deletes the event, its albums, photos and video
              links. Type DELETE to confirm.
            </p>
            <input
              className={`${inputClass} mt-4 border-red-200 bg-white`}
              name="confirmation"
              placeholder="DELETE"
            />
            <button
              type="submit"
              className="mt-3 inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-white px-5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
            >
              Delete rally event
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
