import { notFound, redirect } from "next/navigation";

import { RallyEventStateBadge } from "@/components/rally-events/rally-event-state-badge";
import { RallyEventStats } from "@/components/rally-events/rally-event-stats";
import { getCurrentUser } from "@/lib/auth/session";
import { getRallyEventById } from "@/services/rally-events";

type RallyEventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatChampionship(championship: "WRC" | "ERC" | "national" | "other") {
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

export default async function RallyEventPage({ params }: RallyEventPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    const resolvedParams = await params;
    redirect(`/login?from=/rally-events/${resolvedParams.id}`);
  }

  const { id } = await params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId)) {
    notFound();
  }

  const event = await getRallyEventById(eventId);

  if (!event) {
    notFound();
  }

  const location = event.region
    ? `${event.country} / ${event.region}`
    : event.country;
  const endDate = event.endDate ?? event.startDate;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {event.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImageUrl}
            alt={`${event.title} cover`}
            className="h-64 w-full object-cover"
          />
        ) : null}
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <RallyEventStateBadge state={event.state} />
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-600">
              {event.visibility}
            </span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-normal text-zinc-950">
              {event.title}
            </h1>
            <p className="mt-2 text-lg text-zinc-600">{event.rallyName}</p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase text-zinc-500">
                Championship
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-800">
                {formatChampionship(event.championship)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-zinc-500">
                Season
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-800">
                {event.seasonYear}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-zinc-500">
                Location
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-800">
                {location}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-zinc-500">
                Dates
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-800">
                {formatDate(event.startDate)} - {formatDate(endDate)}
              </dd>
            </div>
          </dl>

          <RallyEventStats
            albumsCount={event.albumsCount}
            photosCount={event.photosCount}
            videosCount={event.videosCount}
          />

          <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
            Rally event details will be implemented in the next step.
          </p>
        </div>
      </article>
    </div>
  );
}
