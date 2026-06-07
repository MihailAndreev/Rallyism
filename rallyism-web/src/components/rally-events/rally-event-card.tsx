import Link from "next/link";

import { RallyEventMetaRow } from "@/components/rally-events/rally-event-meta-row";
import { RallyEventStats } from "@/components/rally-events/rally-event-stats";
import type { RallyEventSummary } from "@/services/rally-events";

function formatChampionship(championship: RallyEventSummary["championship"]) {
  if (championship === "national") {
    return "National rally";
  }

  if (championship === "other") {
    return "Other";
  }

  return championship;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Date TBC";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  const start = formatDate(startDate);
  const end = endDate && endDate !== startDate ? formatDate(endDate) : null;

  return end ? `${start} - ${end}` : start;
}

export function RallyEventCard({
  event,
  compact = false,
}: {
  event: RallyEventSummary;
  compact?: boolean;
}) {
  const location = event.region
    ? `${event.country} / ${event.region}`
    : event.country;

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

        <dl className="grid gap-4 sm:grid-cols-2">
          <RallyEventMetaRow
            label="Championship"
            value={formatChampionship(event.championship)}
          />
          <RallyEventMetaRow label="Season" value={event.seasonYear} />
          <RallyEventMetaRow label="Location" value={location} />
          <RallyEventMetaRow
            label="Dates"
            value={formatDateRange(event.startDate, event.endDate)}
          />
        </dl>

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
