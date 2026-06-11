import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { DashboardRallyEventFilters } from "@/components/rally-events/dashboard-rally-event-filters";
import { EmptyDashboardSection } from "@/components/rally-events/empty-dashboard-section";
import { RallyEventCard } from "@/components/rally-events/rally-event-card";
import { canContribute, isAdmin } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getDashboardRallyEventYearOptions,
  getDashboardRallyEventsPage,
  type DashboardRallyEventChampionshipFilter,
  type DashboardRallyEventVisibilityFilter,
} from "@/services/rally-events";

type DashboardPageProps = {
  searchParams?: Promise<{
    championship?: string;
    page?: string;
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

function parsePage(value: string | undefined) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseYear(value: string | undefined) {
  const year = Number(value);

  return Number.isInteger(year) && year >= 1950 && year <= 2100 ? year : null;
}

function getDashboardHref(input: {
  championship: DashboardRallyEventChampionshipFilter;
  page?: number;
  search?: string;
  visibility: DashboardRallyEventVisibilityFilter;
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

  return `/dashboard${query ? `?${query}` : ""}`;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?from=/dashboard");
  }

  if (!canContribute(user)) {
    redirect("/pending-approval");
  }

  const visibility = parseVisibility(resolvedSearchParams?.visibility);
  const championship = parseChampionship(resolvedSearchParams?.championship);
  const year = parseYear(resolvedSearchParams?.year);
  const page = parsePage(resolvedSearchParams?.page);
  const search = resolvedSearchParams?.q?.trim() ?? "";
  const [eventsPage, yearOptions] = await Promise.all([
    getDashboardRallyEventsPage({
      currentUser: user,
      visibility,
      championship,
      year,
      search,
      page,
      pageSize: 9,
    }),
    getDashboardRallyEventYearOptions(user),
  ]);
  const paginationInput = {
    visibility: eventsPage.visibility,
    championship: eventsPage.championship,
    year: eventsPage.year,
    search: eventsPage.search,
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Image
          src="/images/rallyism-logo.png"
          alt=""
          width={260}
          height={282}
          priority
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-64 w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.079] lg:block"
        />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0">
            <span className="inline-flex rounded-md border border-rally-orange-border bg-white px-2.5 py-1 text-xs font-semibold uppercase text-rally-blue">
              Dashboard
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-zinc-950">
              Welcome to Rallyism
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              Browse rally events and open the memories that are ready for the
              next step.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              href="/rally-events/new"
              className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
            >
              Create rally event
            </Link>
            <Link
              href="/tags"
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
            >
              Browse tags
            </Link>
            {isAdmin(user) ? (
              <>
                <Link
                  href="/admin/rally-events"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
                >
                  Manage content
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
                >
                  Manage users
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
              Rally Events
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

        <DashboardRallyEventFilters
          key={`${eventsPage.search}-${eventsPage.visibility}-${eventsPage.championship}-${eventsPage.year ?? "all"}`}
          championship={eventsPage.championship}
          search={eventsPage.search}
          visibility={eventsPage.visibility}
          year={eventsPage.year}
          yearOptions={yearOptions}
        />

        {eventsPage.events.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {eventsPage.events.map((event) => (
              <RallyEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyDashboardSection
            title="No rally events match these filters."
            description="Clear the search or adjust filters to find more rally memories."
          />
        )}
      </section>

      {eventsPage.totalEvents > 0 ? (
        <nav
          aria-label="Dashboard rally events pagination"
          className="flex items-center justify-between border-t border-zinc-200 pt-6"
        >
          {eventsPage.hasPreviousPage ? (
            <Link
              href={getDashboardHref({
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
              href={getDashboardHref({
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
