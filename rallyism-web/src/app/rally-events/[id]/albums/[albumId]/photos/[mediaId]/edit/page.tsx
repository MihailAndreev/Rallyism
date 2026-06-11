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
    returnTo?: string;
  }>;
};

function getSafeAlbumReturnPath(input: {
  albumId: number;
  rallyEventId: number;
  value: string | undefined;
}) {
  const fallback = `/rally-events/${input.rallyEventId}/albums/${input.albumId}?filter=photos#media-grid`;

  if (!input.value || !input.value.startsWith("/") || input.value.startsWith("//")) {
    return fallback;
  }

  const expectedPrefix = `/rally-events/${input.rallyEventId}/albums/${input.albumId}`;

  return input.value.startsWith(expectedPrefix) ? input.value : fallback;
}

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
        backHref={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}?filter=photos#media-grid`}
        backLabel="Back to album photos"
      />
    );
  }

  const albumPhotosHref = getSafeAlbumReturnPath({
    rallyEventId,
    albumId: parsedAlbumId,
    value: resolvedSearchParams?.returnTo,
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={albumPhotosHref}
        className="inline-flex text-sm font-semibold text-rally-blue hover:text-rally-blue-hover"
      >
        Back to album photos
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">Photo</p>
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
          returnTo={albumPhotosHref}
          submitLabel="Save changes"
        />
      </section>
    </div>
  );
}
