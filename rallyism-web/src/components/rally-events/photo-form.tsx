import Link from "next/link";
import type { ReactNode } from "react";

import type { EditablePhotoItem } from "@/services/rally-events";

type PhotoFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  albumId: number;
  rallyEventId: number;
  cancelHref: string;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  error?: string;
  photo: EditablePhotoItem;
  submitLabel: string;
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

function getPreviewImageUrl(photo: EditablePhotoItem) {
  return photo.thumbnailImageUrl ?? photo.displayImageUrl ?? photo.originalImageUrl;
}

function getDateTimeInputValue(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 16);
}

const inputClass =
  "h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
const textareaClass =
  "min-h-32 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

export function PhotoForm({
  action,
  albumId,
  rallyEventId,
  cancelHref,
  deleteAction,
  error,
  photo,
  submitLabel,
}: PhotoFormProps) {
  const previewImageUrl = getPreviewImageUrl(photo);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
        <div className="aspect-[4/3] bg-zinc-100">
          {previewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImageUrl}
              alt={photo.title ?? photo.originalFilename ?? "Photo preview"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-zinc-500">
              Photo preview
            </div>
          )}
        </div>
      </div>

      <form action={action} className="space-y-6">
        <input type="hidden" name="rallyEventId" value={rallyEventId} />
        <input type="hidden" name="albumId" value={albumId} />
        <input type="hidden" name="mediaId" value={photo.id} />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title">
            <input
              className={inputClass}
              defaultValue={photo.title ?? ""}
              maxLength={180}
              name="title"
              placeholder="Photo title"
            />
          </Field>

          <Field label="Location">
            <input
              className={inputClass}
              defaultValue={photo.location ?? ""}
              maxLength={180}
              name="location"
              placeholder="Stage, service park, city..."
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date taken">
            <input
              className={inputClass}
              defaultValue={getDateTimeInputValue(photo.dateTaken)}
              name="dateTaken"
              type="datetime-local"
            />
          </Field>

          <Field label="Sort order">
            <input
              className={inputClass}
              defaultValue={photo.sortOrder ?? 0}
              name="sortOrder"
              step={1}
              type="number"
            />
          </Field>
        </div>

        <Field label="Caption">
          <textarea
            className={textareaClass}
            defaultValue={photo.caption ?? ""}
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

      {deleteAction ? (
        <form action={deleteAction} className="border-t border-zinc-200 pt-6">
          <input type="hidden" name="rallyEventId" value={rallyEventId} />
          <input type="hidden" name="albumId" value={albumId} />
          <input type="hidden" name="mediaId" value={photo.id} />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
          >
            Delete photo
          </button>
          <p className="mt-2 text-sm text-zinc-500">
            This removes the photo from Rallyism and deletes its R2 files when
            storage keys are present.
          </p>
        </form>
      ) : null}
    </div>
  );
}
