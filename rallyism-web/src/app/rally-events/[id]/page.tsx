import Link from "next/link";
import { notFound } from "next/navigation";

import { AlbumCard } from "@/components/rally-events/album-card";
import { EmptyDashboardSection } from "@/components/rally-events/empty-dashboard-section";
import { MediaPreviewGrid } from "@/components/rally-events/media-preview-grid";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { RallyEventHeader } from "@/components/rally-events/rally-event-header";
import { RallyEventMeta } from "@/components/rally-events/rally-event-meta";
import { RallyEventStateBadge } from "@/components/rally-events/rally-event-state-badge";
import { RallyEventStats } from "@/components/rally-events/rally-event-stats";
import { ShareRallyLinkButton } from "@/components/rally-events/share-rally-link-button";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getRallyEventDetails,
  userCanManageEvent,
} from "@/services/rally-events";

type RallyEventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RallyEventPage({ params }: RallyEventPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  const eventId = Number(id);

  if (!Number.isInteger(eventId)) {
    notFound();
  }

  const result = await getRallyEventDetails(eventId, user);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "access-denied") {
    return (
      <RallyAccessDenied
        backHref={user ? "/dashboard" : "/"}
        backLabel={user ? "Back to Dashboard" : "Back to Rallyism"}
      />
    );
  }

  const { event, albums, mediaPreview } = result;
  const backHref = user ? "/dashboard" : "/";
  const backLabel = user ? "Back to Dashboard" : "Back to Rallyism";
  const canManageEvent = userCanManageEvent(event, user);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={backHref}
          className="inline-flex text-sm font-semibold text-red-700 hover:text-red-800"
        >
          {backLabel}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <main className="space-y-6">
          <RallyEventHeader
            event={event}
            backHref={backHref}
            backLabel={backLabel}
          />

          <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
              Rally information
            </h2>
            {event.description ? (
              <p className="mt-4 text-base leading-7 text-zinc-600">
                {event.description}
              </p>
            ) : (
              <p className="mt-4 text-base leading-7 text-zinc-500">
                No description has been added for this rally event yet.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
                Albums
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Albums are ordered by manual sort order and album date.
              </p>
            </div>
            {albums.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            ) : (
              <EmptyDashboardSection
                title="No albums have been added to this rally event yet."
                description="Albums and rally memories will appear here."
              />
            )}
          </section>

          <MediaPreviewGrid items={mediaPreview} />
        </main>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <RallyEventStateBadge state={event.state} />
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-600">
                {event.visibility}
              </span>
            </div>
            <div className="mt-5">
              <RallyEventStats
                albumsCount={event.albumsCount}
                mediaCount={event.mediaCount}
                photosCount={event.photosCount}
                videosCount={event.videosCount}
              />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Summary</h2>
            <div className="mt-5">
              <RallyEventMeta event={event} />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <ShareRallyLinkButton />
          </section>

          {canManageEvent ? (
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">Manage</h2>
              <Link
                href={`/rally-events/${event.id}/edit`}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
              >
                Edit event
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
