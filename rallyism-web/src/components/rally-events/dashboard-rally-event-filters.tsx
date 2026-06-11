"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type {
  DashboardRallyEventChampionshipFilter,
  DashboardRallyEventVisibilityFilter,
} from "@/services/rally-events";

const visibilityFilters: {
  value: DashboardRallyEventVisibilityFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "unlisted", label: "Unlisted" },
];

const championshipFilters: {
  value: DashboardRallyEventChampionshipFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "WRC", label: "WRC" },
  { value: "ERC", label: "ERC" },
  { value: "national", label: "National" },
  { value: "other", label: "Other" },
];

type DashboardRallyEventFiltersProps = {
  championship: DashboardRallyEventChampionshipFilter;
  clearHref?: string;
  search: string;
  visibility: DashboardRallyEventVisibilityFilter;
  year: number | null;
  yearOptions: number[];
};

export function DashboardRallyEventFilters({
  championship,
  clearHref = "/dashboard",
  search,
  visibility,
  year,
  yearOptions,
}: DashboardRallyEventFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const hasMounted = useRef(false);

  function replaceFilters(input: {
    championship?: DashboardRallyEventChampionshipFilter;
    search?: string;
    visibility?: DashboardRallyEventVisibilityFilter;
    year?: number | null;
  }) {
    const nextVisibility = input.visibility ?? visibility;
    const nextChampionship = input.championship ?? championship;
    const nextYear = input.year === undefined ? year : input.year;
    const nextSearch = input.search ?? searchValue;
    const params = new URLSearchParams();

    if (nextSearch.trim()) {
      params.set("q", nextSearch.trim());
    }

    if (nextVisibility !== "all") {
      params.set("visibility", nextVisibility);
    }

    if (nextChampionship !== "all") {
      params.set("championship", nextChampionship);
    }

    if (nextYear) {
      params.set("year", String(nextYear));
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      replaceFilters({ search: searchValue });
    }, 300);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  return (
    <form
      action={clearHref}
      onSubmit={(event) => {
        event.preventDefault();
        replaceFilters({ search: searchValue });
      }}
      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[1.4fr_150px_170px_140px_auto] lg:items-end"
    >
      <label className="grid gap-1 text-sm font-semibold text-zinc-700">
        Search
        <input
          type="search"
          name="q"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Title, rally, country, region"
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-zinc-700">
        Visibility
        <select
          name="visibility"
          value={visibility}
          onChange={(event) =>
            replaceFilters({
              visibility: event.target.value as DashboardRallyEventVisibilityFilter,
            })
          }
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
          value={championship}
          onChange={(event) =>
            replaceFilters({
              championship: event.target
                .value as DashboardRallyEventChampionshipFilter,
            })
          }
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
        <select
          name="year"
          value={year ? String(year) : "all"}
          onChange={(event) =>
            replaceFilters({
              year:
                event.target.value === "all" ? null : Number(event.target.value),
            })
          }
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
        >
          <option value="all">All</option>
          {yearOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <Link
        href={clearHref}
        className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
      >
        Clear
      </Link>
    </form>
  );
}
