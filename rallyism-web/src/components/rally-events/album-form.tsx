import Link from "next/link";
import type { ReactNode } from "react";

import type { RallyEventAlbum } from "@/services/rally-events";

type AlbumFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  album?: RallyEventAlbum;
  albumId?: number;
  rallyEventId: number;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  error?: string;
  submitLabel: string;
  cancelHref: string;
};

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

export function AlbumForm({
  action,
  album,
  albumId,
  rallyEventId,
  deleteAction,
  error,
  submitLabel,
  cancelHref,
}: AlbumFormProps) {
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
        <Field label="Title">
          <input
            className={inputClass}
            defaultValue={album?.title}
            maxLength={180}
            name="title"
            required
          />
        </Field>

        <Field label="Album date">
          <input
            className={inputClass}
            defaultValue={album?.albumDate ?? ""}
            name="albumDate"
            type="date"
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
