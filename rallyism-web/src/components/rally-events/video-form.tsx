import Link from "next/link";
import type { ReactNode } from "react";

import type { EditableVideoItem } from "@/services/rally-events";

type VideoFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  albumId: number;
  rallyEventId: number;
  cancelHref: string;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  error?: string;
  submitLabel: string;
  video?: EditableVideoItem;
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

export function VideoForm({
  action,
  albumId,
  rallyEventId,
  cancelHref,
  deleteAction,
  error,
  submitLabel,
  video,
}: VideoFormProps) {
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        <input type="hidden" name="rallyEventId" value={rallyEventId} />
        <input type="hidden" name="albumId" value={albumId} />
        {video ? <input type="hidden" name="mediaId" value={video.id} /> : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <Field label="YouTube URL">
          <input
            className={inputClass}
            defaultValue={video?.youtubeUrl ?? ""}
            name="youtubeUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            required
            type="url"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title">
            <input
              className={inputClass}
              defaultValue={video?.title ?? ""}
              maxLength={180}
              name="title"
              placeholder="YouTube video"
            />
          </Field>

          <Field label="Sort order">
            <input
              className={inputClass}
              defaultValue={video?.sortOrder ?? 0}
              name="sortOrder"
              step={1}
              type="number"
            />
          </Field>
        </div>

        <Field label="Description / caption">
          <textarea
            className={textareaClass}
            defaultValue={video?.caption ?? ""}
            name="caption"
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

      {deleteAction && video ? (
        <form action={deleteAction} className="border-t border-zinc-200 pt-6">
          <input type="hidden" name="rallyEventId" value={rallyEventId} />
          <input type="hidden" name="albumId" value={albumId} />
          <input type="hidden" name="mediaId" value={video.id} />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
          >
            Delete video
          </button>
          <p className="mt-2 text-sm text-zinc-500">
            This removes the YouTube link from Rallyism. The video on YouTube is
            not affected.
          </p>
        </form>
      ) : null}
    </div>
  );
}
