import Link from "next/link";

import { RallyEventStateBadge } from "@/components/rally-events/rally-event-state-badge";
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
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {event.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverImageUrl}
          alt={`${event.title} cover`}
          className="h-72 w-full object-cover"
        />
      ) : null}
      <div className="space-y-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <RallyEventStateBadge state={event.state} />
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
          <h1 className="text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
            {event.title}
          </h1>
          <p className="mt-2 text-lg text-zinc-600">{event.rallyName}</p>
        </div>
        <Link
          href={backHref}
          className="inline-flex text-sm font-semibold text-red-700 hover:text-red-800"
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
