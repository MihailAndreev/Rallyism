import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createVideoAction } from "@/app/rally-events/[id]/albums/[albumId]/videos/new/actions";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { VideoForm } from "@/components/rally-events/video-form";
import { requireContributor } from "@/lib/auth/authorization";
import { getEditableAlbum } from "@/services/rally-events";

type NewVideoPageProps = {
  params: Promise<{
    id: string;
    albumId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewVideoPage({
  params,
  searchParams,
}: NewVideoPageProps) {
  const [{ id, albumId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const user = await requireContributor(
    `/rally-events/${id}/albums/${albumId}/videos/new`,
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
        className="inline-flex text-sm font-semibold text-rally-blue hover:text-rally-blue-hover"
      >
        Back to album
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">
          YouTube video
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Add YouTube video
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Save a YouTube link inside {result.album.title}.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <VideoForm
          action={createVideoAction}
          albumId={parsedAlbumId}
          cancelHref={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}`}
          error={resolvedSearchParams?.error}
          rallyEventId={rallyEventId}
          submitLabel="Add video"
        />
      </section>
    </div>
  );
}
