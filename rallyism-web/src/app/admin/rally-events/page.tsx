import Link from "next/link";
import Image from "next/image";

import {
  formatChampionship,
  formatDateRange,
  formatDateTime,
} from "@/components/rally-events/rally-event-format";
import { requireAdmin } from "@/lib/auth/authorization";
import {
  getAdminRallyEventsPage,
  type AdminRallyEventChampionshipFilter,
  type AdminRallyEventListItem,
  type AdminRallyEventVisibilityFilter,
} from "@/services/rally-events";

type AdminRallyEventsPageProps = {
  searchParams?: Promise<{
    championship?: string;
    page?: string;
    q?: string;
    visibility?: string;
    year?: string;
  }>;
};

const visibilityFilters: {
  value: AdminRallyEventVisibilityFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "unlisted", label: "Unlisted" },
];

const championshipFilters: {
  value: AdminRallyEventChampionshipFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "WRC", label: "WRC" },
  { value: "ERC", label: "ERC" },
  { value: "national", label: "National" },
  { value: "other", label: "Other" },
];

function parseVisibility(value: string | undefined): AdminRallyEventVisibilityFilter {
  if (value === "public" || value === "private" || value === "unlisted") {
    return value;
  }

  return "all";
}

function parseChampionship(
  value: string | undefined,
): AdminRallyEventChampionshipFilter {
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

function parsePage(value: string | undefined) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseYear(value: string | undefined) {
  const year = Number(value);

  return Number.isInteger(year) && year >= 1950 && year <= 2100 ? year : null;
}

function getAdminRallyEventsHref(input: {
  championship: AdminRallyEventChampionshipFilter;
  page?: number;
  search?: string;
  visibility: AdminRallyEventVisibilityFilter;
  year?: number | null;
}) {
  const params = new URLSearchParams();

  if (input.visibility !== "all") {
    params.set("visibility", input.visibility);
  }

  if (input.championship !== "all") {
    params.set("championship", input.championship);
  }

  if (input.year) {
    params.set("year", String(input.year));
  }

  if (input.search?.trim()) {
    params.set("q", input.search.trim());
  }

  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }

  const query = params.toString();

  return `/admin/rally-events${query ? `?${query}` : ""}`;
}

function VisibilityBadge({
  visibility,
}: {
  visibility: AdminRallyEventListItem["visibility"];
}) {
  const classes = {
    private: "border-zinc-200 bg-zinc-50 text-zinc-700",
    public: "border-emerald-200 bg-emerald-50 text-emerald-700",
    unlisted: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold capitalize ${classes[visibility]}`}
    >
      {visibility}
    </span>
  );
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700">
      {value} {label}
    </span>
  );
}

function AdminAccessDenied() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">
          Admin access required
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950">
          You do not have access to content management.
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          Admin content pages are only available to Rallyism admin users.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-rally-blue px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
        >
          Back to Dashboard
        </Link>
      </section>
    </div>
  );
}

function AdminLinks() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
      >
        Back to Dashboard
      </Link>
      <Link
        href="/admin/users"
        className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
      >
        User approvals
      </Link>
      <Link
        href="/admin/rally-events"
        className="inline-flex h-10 items-center justify-center rounded-md border border-rally-orange-border bg-rally-orange-soft px-4 text-sm font-semibold text-zinc-950 shadow-sm"
      >
        Rally events
      </Link>
      <Link
        href="/admin/tags"
        className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
      >
        Tags
      </Link>
    </div>
  );
}

function EventActions({ event }: { event: AdminRallyEventListItem }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/rally-events/${event.id}`}
        className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
      >
        Open
      </Link>
      <Link
        href={`/rally-events/${event.id}/edit`}
        className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
      >
        Edit/delete
      </Link>
      <Link
        href={`/rally-events/${event.id}/albums/new`}
        className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
      >
        Create album
      </Link>
    </div>
  );
}

export default async function AdminRallyEventsPage({
  searchParams,
}: AdminRallyEventsPageProps) {
  const resolvedSearchParams = await searchParams;
  const admin = await requireAdmin("/admin/rally-events");

  if (!admin) {
    return <AdminAccessDenied />;
  }

  const visibility = parseVisibility(resolvedSearchParams?.visibility);
  const championship = parseChampionship(resolvedSearchParams?.championship);
  const year = parseYear(resolvedSearchParams?.year);
  const page = parsePage(resolvedSearchParams?.page);
  const search = resolvedSearchParams?.q?.trim() ?? "";
  const eventsPage = await getAdminRallyEventsPage({
    visibility,
    championship,
    year,
    search,
    page,
    pageSize: 12,
  });
  const paginationInput = {
    visibility: eventsPage.visibility,
    championship: eventsPage.championship,
    year: eventsPage.year,
    search: eventsPage.search,
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <AdminLinks />

      <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Image
          src="/images/rallyism-logo.png"
          alt=""
          width={260}
          height={282}
          priority
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-56 w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.079] lg:block"
        />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div className="min-w-0">
            <span className="inline-flex rounded-md border border-rally-orange-border bg-white px-2.5 py-1 text-xs font-semibold uppercase text-rally-blue">
              Admin
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-zinc-950">
              Rally event content
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
              Review rally events, visibility, ownership and content counts.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              href="/rally-events/new"
              className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
            >
              Create rally event
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <form action="/admin/rally-events" className="grid gap-3 lg:grid-cols-[1.4fr_150px_170px_120px_auto] lg:items-end">
          <label className="grid gap-1 text-sm font-semibold text-zinc-700">
            Search
            <input
              type="search"
              name="q"
              defaultValue={eventsPage.search}
              placeholder="Title, rally, country, creator"
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-zinc-700">
            Visibility
            <select
              name="visibility"
              defaultValue={eventsPage.visibility}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
            >
              {visibilityFilters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-zinc-700">
            Championship
            <select
              name="championship"
              defaultValue={eventsPage.championship}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
            >
              {championshipFilters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-zinc-700">
            Year
            <input
              type="number"
              name="year"
              min="1950"
              max="2100"
              defaultValue={eventsPage.year ?? ""}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Apply
          </button>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
              Events
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Page {eventsPage.currentPage} of {eventsPage.totalPages}
            </p>
          </div>
          <p className="text-sm font-medium text-zinc-600">
            {eventsPage.totalEvents} event
            {eventsPage.totalEvents === 1 ? "" : "s"} in this view
          </p>
        </div>

        {eventsPage.events.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_160px_150px_170px_minmax(240px,1fr)] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 lg:grid">
              <div>Event</div>
              <div>Visibility</div>
              <div>Content</div>
              <div>Dates</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-zinc-200">
              {eventsPage.events.map((event) => (
                <article
                  key={event.id}
                  className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.5fr)_160px_150px_170px_minmax(240px,1fr)] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-sm font-semibold text-zinc-950">
                        {event.title}
                      </h3>
                      {event.featured ? (
                        <span className="inline-flex rounded-md border border-rally-orange-border bg-rally-orange-soft px-2 py-1 text-xs font-semibold text-rally-orange">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 break-words text-sm text-zinc-600">
                      {event.rallyName} {event.seasonYear} ·{" "}
                      {formatChampionship(event.championship)}
                    </p>
                    <p className="mt-1 break-words text-xs text-zinc-500">
                      {[event.country, event.region].filter(Boolean).join(", ")}
                    </p>
                    <p className="mt-2 break-words text-xs text-zinc-500">
                      Creator: {event.creatorName || "Unknown"}
                      {event.creatorEmail ? ` (${event.creatorEmail})` : ""}
                    </p>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Visibility
                    </span>
                    <VisibilityBadge visibility={event.visibility} />
                  </div>
                  <div>
                    <span className="mb-2 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Content
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <CountPill label="albums" value={event.albumsCount} />
                      <CountPill label="photos" value={event.photosCount} />
                      <CountPill label="videos" value={event.videosCount} />
                    </div>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Dates
                    </span>
                    <p className="text-sm text-zinc-600">
                      {formatDateRange(event.startDate, event.endDate)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Updated {formatDateTime(event.updatedAt)}
                    </p>
                  </div>
                  <div>
                    <span className="mb-2 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Actions
                    </span>
                    <EventActions event={event} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-950">
              No rally events match these filters.
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Clear the search or adjust filters to review more content.
            </p>
          </div>
        )}
      </section>

      {eventsPage.totalEvents > 0 ? (
        <nav
          aria-label="Rally event pagination"
          className="flex items-center justify-between border-t border-zinc-200 pt-6"
        >
          {eventsPage.hasPreviousPage ? (
            <Link
              href={getAdminRallyEventsHref({
                ...paginationInput,
                page: eventsPage.currentPage - 1,
              })}
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
            {eventsPage.totalEvents} event
            {eventsPage.totalEvents === 1 ? "" : "s"}
          </p>
          {eventsPage.hasNextPage ? (
            <Link
              href={getAdminRallyEventsHref({
                ...paginationInput,
                page: eventsPage.currentPage + 1,
              })}
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
