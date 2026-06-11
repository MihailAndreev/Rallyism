import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  deleteVideoAction,
  updateVideoAction,
} from "@/app/rally-events/[id]/albums/[albumId]/videos/[mediaId]/edit/actions";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { VideoForm } from "@/components/rally-events/video-form";
import { requireContributor } from "@/lib/auth/authorization";
import { getEditableVideo } from "@/services/rally-events";

type EditVideoPageProps = {
  params: Promise<{
    id: string;
    albumId: string;
    mediaId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditVideoPage({
  params,
  searchParams,
}: EditVideoPageProps) {
  const [{ id, albumId, mediaId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const user = await requireContributor(
    `/rally-events/${id}/albums/${albumId}/videos/${mediaId}/edit`,
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

  const result = await getEditableVideo({
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
        backHref={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}`}
        backLabel="Back to album"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}?filter=videos#media-grid`}
        className="inline-flex text-sm font-semibold text-rally-blue hover:text-rally-blue-hover"
      >
        Back to album videos
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">
          YouTube video
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Edit YouTube video
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Update video metadata for {result.album.title}.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <VideoForm
          action={updateVideoAction}
          albumId={parsedAlbumId}
          cancelHref={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}?filter=videos#media-grid`}
          deleteAction={deleteVideoAction}
          error={resolvedSearchParams?.error}
          rallyEventId={rallyEventId}
          submitLabel="Save changes"
          video={result.video}
        />
      </section>
    </div>
  );
}
