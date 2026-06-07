import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { uploadPhotosAction } from "@/app/rally-events/[id]/albums/[albumId]/photos/upload/actions";
import { PhotoUploadForm } from "@/components/rally-events/photo-upload-form";
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

        <PhotoUploadForm
          action={uploadPhotosAction}
          albumId={parsedAlbumId}
          cancelHref={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}`}
          rallyEventId={rallyEventId}
        />
      </section>
    </div>
  );
}
