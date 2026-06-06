import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { uploadPhotosAction } from "@/app/rally-events/[id]/albums/[albumId]/photos/upload/actions";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { requireContributor } from "@/lib/auth/authorization";
import {
  PHOTO_UPLOAD_MAX_FILE_SIZE_BYTES,
  PHOTO_UPLOAD_MAX_FILES,
} from "@/services/photo-uploads";
import { getEditableAlbum } from "@/services/rally-events";

type UploadPhotosPageProps = {
  params: Promise<{
    id: string;
    albumId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

function formatMegabytes(bytes: number) {
  return Math.round(bytes / 1024 / 1024);
}

export default async function UploadPhotosPage({
  params,
  searchParams,
}: UploadPhotosPageProps) {
  const [{ id, albumId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const user = await requireContributor(
    `/rally-events/${id}/albums/${albumId}/photos/upload`,
  );

  if (!user) {
    redirect("/pending-approval");
  }

  const rallyEventId = Number(id);
  const parsedAlbumId = Number(albumId);

  if (!Number.isInteger(rallyEventId) || !Number.isInteger(parsedAlbumId)) {
    notFound();
  }

  const result = await getEditableAlbum({
    rallyEventId,
    albumId: parsedAlbumId,
    currentUser: user,
  });

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "access-denied") {
    return (
      <RallyAccessDenied
        backHref={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}`}
        backLabel="Back to album"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}`}
        className="inline-flex text-sm font-semibold text-red-700 hover:text-red-800"
      >
        Back to album
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-red-700">Photos</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Upload photos
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Add JPG, PNG or WebP photos to {result.album.title}. Each upload can
          include up to {PHOTO_UPLOAD_MAX_FILES} files, with a maximum of{" "}
          {formatMegabytes(PHOTO_UPLOAD_MAX_FILE_SIZE_BYTES)} MB per photo.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        {resolvedSearchParams?.error ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {resolvedSearchParams.error}
          </div>
        ) : null}

        <form action={uploadPhotosAction} className="space-y-6">
          <input type="hidden" name="rallyEventId" value={rallyEventId} />
          <input type="hidden" name="albumId" value={parsedAlbumId} />

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
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-900 hover:file:bg-zinc-200 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
            <p className="text-sm leading-6 text-zinc-500">
              HEIC photos are rejected for now. Uploaded images are converted to
              WebP display and thumbnail files.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Upload photos
            </button>
            <Link
              href={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
