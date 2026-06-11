import Link from "next/link";
import Image from "next/image";

import { formatDateRange } from "@/components/rally-events/rally-event-format";
import type { RallyEventSummary } from "@/services/rally-events";

export function RallyEventHeader({
  event,
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
}: {
  event: RallyEventSummary;
  backHref?: string;
  backLabel?: string;
}) {
  const details = [
    event.rallyName,
    event.seasonYear,
    event.startDate || event.endDate
      ? formatDateRange(event.startDate, event.endDate)
      : null,
    event.country,
    event.region,
  ].filter(Boolean);

  return (
    <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <Image
        src="/images/rallyism-logo.png"
        alt=""
        width={220}
        height={239}
        priority
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-1/2 hidden h-56 w-auto -translate-y-1/2 opacity-[0.055] sm:block"
      />
      <div className="relative space-y-4">
        <Link
          href={backHref}
          className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
        >
          {backLabel}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-600">
            {event.visibility}
          </span>
          {event.featured ? (
            <span className="rounded-md border border-rally-orange-border bg-rally-orange-soft px-2.5 py-1 text-xs font-semibold text-rally-orange">
              Featured
            </span>
          ) : null}
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
            {event.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {details.map((detail) => (
              <span
                key={String(detail)}
                className="rounded-md border border-rally-orange-border bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                {detail}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
