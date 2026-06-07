import Link from "next/link";

import { RallyEventStateBadge } from "@/components/rally-events/rally-event-state-badge";
import { RallyEventStats } from "@/components/rally-events/rally-event-stats";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicRallyEventsPage } from "@/services/rally-events";
import type { RallyEventSummary } from "@/services/rally-events";

type HomeProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function PublicRallyEventCard({ event }: { event: RallyEventSummary }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md">
      <Link href={`/rally-events/${event.id}`} className="block">
        {event.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImageUrl}
            alt={`${event.title} cover`}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-zinc-100 px-6 text-center text-sm font-semibold text-zinc-500">
            Rallyism
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <RallyEventStateBadge state={event.state} />
          {event.featured ? (
            <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              Featured
            </span>
          ) : null}
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-normal text-zinc-950 group-hover:text-red-700">
            <Link href={`/rally-events/${event.id}`}>{event.title}</Link>
          </h2>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            {event.rallyName}
          </p>
        </div>

        <div className="mt-auto space-y-5">
          <RallyEventStats
            albumsCount={event.albumsCount}
            mediaCount={event.mediaCount}
            photosCount={event.photosCount}
            videosCount={event.videosCount}
          />
          <Link
            href={`/rally-events/${event.id}`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Open event
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const page = parsePage(resolvedSearchParams?.page);
  const user = await getCurrentUser();
  const publicEventsPage = await getPublicRallyEventsPage({ page, pageSize: 9 });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-red-700">
              Rallyism
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
              Public rally memories
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              Browse published rally events, albums, photos and YouTube video
              links from the Rallyism archive.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {publicEventsPage.events.length > 0 ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
              Published events
            </h2>
            <p className="text-sm text-zinc-500">
              Page {publicEventsPage.currentPage} of {publicEventsPage.totalPages}
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {publicEventsPage.events.map((event) => (
              <PublicRallyEventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase text-red-700">
            No public events
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-zinc-950">
            Rally memories will appear here when they are published.
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Private and unlisted rally events stay out of the public gallery.
          </p>
        </section>
      )}

      {publicEventsPage.totalEvents > 0 ? (
        <nav
          aria-label="Public rally events pagination"
          className="flex items-center justify-between border-t border-zinc-200 pt-6"
        >
          {publicEventsPage.hasPreviousPage ? (
            <Link
              href={`/?page=${publicEventsPage.currentPage - 1}`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-400">
              Previous
            </span>
          )}
          <p className="text-sm text-zinc-500">
            {publicEventsPage.totalEvents} published event
            {publicEventsPage.totalEvents === 1 ? "" : "s"}
          </p>
          {publicEventsPage.hasNextPage ? (
            <Link
              href={`/?page=${publicEventsPage.currentPage + 1}`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-400">
              Next
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
