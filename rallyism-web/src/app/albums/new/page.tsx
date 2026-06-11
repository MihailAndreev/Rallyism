import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardRallyEventFilters } from "@/components/rally-events/dashboard-rally-event-filters";
import { formatDateRange } from "@/components/rally-events/rally-event-format";
import { requireContributor } from "@/lib/auth/authorization";
import {
  getCreatableAlbumEventsPage,
  getCreatableAlbumEventYearOptions,
  type DashboardRallyEventChampionshipFilter,
  type DashboardRallyEventVisibilityFilter,
} from "@/services/rally-events";

type ChooseAlbumEventPageProps = {
  searchParams?: Promise<{
    championship?: string;
    q?: string;
    visibility?: string;
    year?: string;
  }>;
};

function parseVisibility(value: string | undefined): DashboardRallyEventVisibilityFilter {
  if (value === "public" || value === "private" || value === "unlisted") {
    return value;
  }

  return "all";
}

function parseChampionship(
  value: string | undefined,
): DashboardRallyEventChampionshipFilter {
  if (
    value === "WRC" ||
    value === "ERC" ||
    value === "national" ||
    value === "other"
  ) {
    return value;
  }

  return "all";
}

function parseYear(value: string | undefined) {
  const year = Number(value);

  return Number.isInteger(year) && year >= 1950 && year <= 2100 ? year : null;
}

export default async function ChooseAlbumEventPage({
  searchParams,
}: ChooseAlbumEventPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await requireContributor("/albums/new");

  if (!user) {
    redirect("/pending-approval");
  }

  const visibility = parseVisibility(resolvedSearchParams?.visibility);
  const championship = parseChampionship(resolvedSearchParams?.championship);
  const year = parseYear(resolvedSearchParams?.year);
  const search = resolvedSearchParams?.q?.trim() ?? "";
  const [eventsPage, yearOptions] = await Promise.all([
    getCreatableAlbumEventsPage({
      currentUser: user,
      visibility,
      championship,
      year,
      search,
    }),
    getCreatableAlbumEventYearOptions(user),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="inline-flex text-sm font-semibold text-rally-blue hover:text-rally-blue-hover"
      >
        Back to dashboard
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">Album</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Choose event
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Select the rally event where you want to create your album.
        </p>
      </section>

      <DashboardRallyEventFilters
        championship={eventsPage.championship}
        clearHref="/albums/new"
        search={eventsPage.search}
        visibility={eventsPage.visibility}
        year={eventsPage.year}
        yearOptions={yearOptions}
      />

      {eventsPage.events.length > 0 ? (
        <section className="grid gap-4">
          {eventsPage.events.map((event) => (
            <Link
              key={event.id}
              href={`/rally-events/${event.id}/albums/new`}
              className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rally-blue-border hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-600">
                      {event.visibility}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
                    {event.title}
                  </h2>
                  <p className="text-sm font-medium text-zinc-600">
                    {event.rallyName}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-500">
                    <span>{event.seasonYear}</span>
                    <span>{event.country}</span>
                    {event.region ? <span>{event.region}</span> : null}
                    {event.startDate || event.endDate ? (
                      <span>{formatDateRange(event.startDate, event.endDate)}</span>
                    ) : null}
                  </div>
                </div>

                <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover">
                  Create album
                </span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">
            No events match these filters.
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Try widening the search or clearing one of the active filters.
          </p>
        </section>
      )}
    </div>
  );
}
