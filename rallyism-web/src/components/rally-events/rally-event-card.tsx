import Link from "next/link";

import { RallyEventStats } from "@/components/rally-events/rally-event-stats";
import type { RallyEventSummary } from "@/services/rally-events";

export function RallyEventCard({
  event,
  compact = false,
}: {
  event: RallyEventSummary;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/rally-events/${event.id}`}
      className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      {event.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverImageUrl}
          alt={`${event.title} cover`}
          className={compact ? "h-36 w-full object-cover" : "h-48 w-full object-cover"}
        />
      ) : null}
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-600">
            {event.visibility}
          </span>
          {event.featured ? (
            <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              Featured
            </span>
          ) : null}
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-normal text-zinc-950 group-hover:text-red-700">
            {event.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{event.rallyName}</p>
        </div>

        <RallyEventStats
          albumsCount={event.albumsCount}
          mediaCount={event.mediaCount}
          photosCount={event.photosCount}
          videosCount={event.videosCount}
        />

        <div className="inline-flex text-sm font-semibold text-red-700">
          View rally
        </div>
      </div>
    </Link>
  );
}
