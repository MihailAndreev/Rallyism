"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

type PhotoUploadFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  albumId: number;
  cancelHref: string;
  rallyEventId: number;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Uploading photos..." : "Upload photos"}
    </button>
  );
}

export function PhotoUploadForm({
  action,
  albumId,
  cancelHref,
  rallyEventId,
}: PhotoUploadFormProps) {
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="rallyEventId" value={rallyEventId} />
      <input type="hidden" name="albumId" value={albumId} />

      <div className="space-y-2">
        <label
          htmlFor="photos"
          className="block text-sm font-semibold text-zinc-950"
        >
          Photo files
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-900 hover:file:bg-zinc-200 focus:border-rally-blue focus:outline-none focus:ring-2 focus:ring-rally-blue-soft"
        />
        <p className="text-sm leading-6 text-zinc-500">
          HEIC photos are rejected for now. Uploaded images are converted to WebP
          display and thumbnail files.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
