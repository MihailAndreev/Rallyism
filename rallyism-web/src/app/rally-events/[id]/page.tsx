import Link from "next/link";
import { notFound } from "next/navigation";

import { AlbumCard, EmptyAlbumCard } from "@/components/rally-events/album-card";
import { MediaPreviewStrip } from "@/components/rally-events/media-preview-grid";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { RallyEventHeader } from "@/components/rally-events/rally-event-header";
import { RallyEventMeta } from "@/components/rally-events/rally-event-meta";
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
  const description = event.description?.trim();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <main className="space-y-6">
          <RallyEventHeader
            event={event}
            backHref={backHref}
            backLabel={backLabel}
          />

          {description ? (
            <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
                Rally information
              </h2>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                {description}
              </p>
            </section>
          ) : null}

          <MediaPreviewStrip items={mediaPreview} />

          <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-normal text-zinc-950">
                  Albums
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { label: "Albums", value: event.albumsCount },
                    { label: "Media", value: event.mediaCount },
                    { label: "Photos", value: event.photosCount },
                    { label: "Videos", value: event.videosCount },
                  ].map((stat) => (
                    <span
                      key={stat.label}
                      className="rounded-md border border-rally-orange-border bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
                    >
                      {stat.label}{" "}
                      <span className="font-bold text-zinc-900">
                        {stat.value}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              {canManageEvent ? (
                <Link
                  href={`/rally-events/${event.id}/albums/new`}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
                >
                  Create album
                </Link>
              ) : null}
            </div>
            {albums.length > 0 ? (
              <div
                className={
                  albums.length === 1
                    ? "grid gap-5 sm:max-w-xl"
                    : "grid gap-5 sm:grid-cols-2"
                }
              >
                {albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    showPrivateIndicator={canManageEvent}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <EmptyAlbumCard />
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Event details</h2>
            <div className="mt-5">
              <RallyEventMeta event={event} />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Actions</h2>
            <div className="mt-4 space-y-3">
              <ShareRallyLinkButton />

              {canManageEvent ? (
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/rally-events/${event.id}/edit`}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
                  >
                    Edit event
                  </Link>
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
