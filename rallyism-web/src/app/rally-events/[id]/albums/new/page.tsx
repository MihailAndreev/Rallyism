import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createAlbumAction } from "@/app/rally-events/[id]/albums/new/actions";
import { AlbumForm } from "@/components/rally-events/album-form";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { requireContributor } from "@/lib/auth/authorization";
import { getEditableRallyEvent } from "@/services/rally-events";

type NewAlbumPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewAlbumPage({
  params,
  searchParams,
}: NewAlbumPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const user = await requireContributor(`/rally-events/${id}/albums/new`);

  if (!user) {
    redirect("/pending-approval");
  }

  const rallyEventId = Number(id);

  if (!Number.isInteger(rallyEventId)) {
    notFound();
  }

  const result = await getEditableRallyEvent(rallyEventId, user);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "access-denied") {
    return (
      <RallyAccessDenied
        backHref={`/rally-events/${rallyEventId}`}
        backLabel="Back to rally event"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/rally-events/${rallyEventId}`}
        className="inline-flex text-sm font-semibold text-rally-blue hover:text-rally-blue-hover"
      >
        Back to rally event
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">Album</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Create album
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Add a new album inside {result.event.title}.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <AlbumForm
          action={createAlbumAction}
          cancelHref={`/rally-events/${rallyEventId}`}
          error={resolvedSearchParams?.error}
          rallyEventId={rallyEventId}
          submitLabel="Create album"
        />
      </section>
    </div>
  );
}
