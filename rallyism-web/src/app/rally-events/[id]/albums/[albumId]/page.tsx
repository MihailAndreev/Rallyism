import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { getCurrentUser } from "@/lib/auth/session";
import { getAlbumPlaceholderDetails } from "@/services/rally-events";

type AlbumPageProps = {
  params: Promise<{
    id: string;
    albumId: string;
  }>;
};

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id, albumId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?from=/rally-events/${id}/albums/${albumId}`);
  }

  const rallyEventId = Number(id);
  const parsedAlbumId = Number(albumId);

  if (!Number.isInteger(rallyEventId) || !Number.isInteger(parsedAlbumId)) {
    notFound();
  }

  const result = await getAlbumPlaceholderDetails({
    rallyEventId,
    albumId: parsedAlbumId,
    currentUser: user,
  });

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "access-denied") {
    return <RallyAccessDenied />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link
          href={`/rally-events/${rallyEventId}`}
          className="text-sm font-semibold text-red-700 hover:text-red-800"
        >
          Back to rally event
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase text-red-700">
          Album
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          {result.album.title}
        </h1>
        {result.album.description ? (
          <p className="mt-4 text-base leading-7 text-zinc-600">
            {result.album.description}
          </p>
        ) : null}
        <p className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
          Album details and media gallery will be implemented in the next step.
        </p>
      </section>
    </div>
  );
}
