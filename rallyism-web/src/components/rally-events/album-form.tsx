import Link from "next/link";
import type { ReactNode } from "react";

import {
  eventSupportsAlbumVisibilityControl,
  getDefaultAlbumVisibilityForEvent,
} from "@/lib/rally-events/album-visibility";
import { formatDateForDisplay } from "@/services/rally-events";
import type {
  RallyEventAlbum,
  RallyEventVisibility,
} from "@/services/rally-events";
import { DateTextInput } from "@/components/ui/date-text-input";

type AlbumFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  album?: RallyEventAlbum;
  albumId?: number;
  rallyEventId: number;
  eventVisibility: RallyEventVisibility;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  error?: string;
  submitLabel: string;
  cancelHref: string;
};

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

export function AlbumForm({
  action,
  album,
  albumId,
  rallyEventId,
  eventVisibility,
  deleteAction,
  error,
  submitLabel,
  cancelHref,
}: AlbumFormProps) {
  const showVisibilityControl = eventSupportsAlbumVisibilityControl(eventVisibility);
  const defaultVisibility =
    album?.visibility ?? getDefaultAlbumVisibilityForEvent(eventVisibility);

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        <input type="hidden" name="rallyEventId" value={rallyEventId} />
        {albumId ? <input type="hidden" name="albumId" value={albumId} /> : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" required>
          <input
            className={inputClass}
            defaultValue={album?.title}
            maxLength={180}
            name="title"
            required
          />
        </Field>

        <Field label="Album date">
          <DateTextInput
            className={inputClass}
            defaultValue={formatDateForDisplay(album?.albumDate)}
            name="albumDate"
          />
        </Field>

        <Field label="Cover image URL">
          <input
            className={inputClass}
            defaultValue={album?.coverImageUrl ?? ""}
            name="coverImageUrl"
            type="url"
          />
        </Field>

        <Field label="Sort order">
          <input
            className={inputClass}
            defaultValue={album?.sortOrder ?? 0}
            name="sortOrder"
            step={1}
            type="number"
          />
        </Field>
        </div>

        <Field label="Description">
          <textarea
            className={textareaClass}
            defaultValue={album?.description ?? ""}
            name="description"
          />
        </Field>

        {showVisibilityControl ? (
          <Field label="Album visibility">
            <select
              className={inputClass}
              defaultValue={defaultVisibility}
              name="visibility"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </Field>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            This event is private, so this album automatically stays private.
          </div>
        )}

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

      {deleteAction && albumId ? (
        <form action={deleteAction} className="border-t border-zinc-200 pt-6">
          <input type="hidden" name="rallyEventId" value={rallyEventId} />
          <input type="hidden" name="albumId" value={albumId} />
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h2 className="text-base font-semibold text-red-900">
              Delete album
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              This permanently deletes the album, its photos and video links.
              Type DELETE to confirm.
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
              Delete album
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
