import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  deletePhotoAction,
  updatePhotoAction,
} from "@/app/rally-events/[id]/albums/[albumId]/photos/[mediaId]/edit/actions";
import { PhotoForm } from "@/components/rally-events/photo-form";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { requireContributor } from "@/lib/auth/authorization";
import { getEditablePhoto } from "@/services/rally-events";

type EditPhotoPageProps = {
  params: Promise<{
    id: string;
    albumId: string;
    mediaId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditPhotoPage({
  params,
  searchParams,
}: EditPhotoPageProps) {
  const [{ id, albumId, mediaId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const user = await requireContributor(
    `/rally-events/${id}/albums/${albumId}/photos/${mediaId}/edit`,
  );

  if (!user) {
    redirect("/pending-approval");
  }

  const rallyEventId = Number(id);
  const parsedAlbumId = Number(albumId);
  const parsedMediaId = Number(mediaId);

  if (
    !Number.isInteger(rallyEventId) ||
    !Number.isInteger(parsedAlbumId) ||
    !Number.isInteger(parsedMediaId)
  ) {
    notFound();
  }

  const result = await getEditablePhoto({
    rallyEventId,
    albumId: parsedAlbumId,
    mediaId: parsedMediaId,
    currentUser: user,
  });

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "access-denied") {
    return (
      <RallyAccessDenied
        backHref={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}?filter=photos`}
        backLabel="Back to album photos"
      />
    );
  }

  const albumPhotosHref = `/rally-events/${rallyEventId}/albums/${parsedAlbumId}?filter=photos`;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={albumPhotosHref}
        className="inline-flex text-sm font-semibold text-red-700 hover:text-red-800"
      >
        Back to album photos
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-red-700">Photo</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Edit photo
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Update photo metadata for {result.album.title}.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <PhotoForm
          action={updatePhotoAction}
          albumId={parsedAlbumId}
          cancelHref={albumPhotosHref}
          deleteAction={deletePhotoAction}
          error={resolvedSearchParams?.error}
          photo={result.photo}
          rallyEventId={rallyEventId}
          submitLabel="Save changes"
        />
      </section>
    </div>
  );
}
