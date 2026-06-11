import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { EmptyDashboardSection } from "@/components/rally-events/empty-dashboard-section";
import { RallyEventCard } from "@/components/rally-events/rally-event-card";
import { canContribute, isAdmin } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardRallyEvents } from "@/services/rally-events";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?from=/dashboard");
  }

  if (!canContribute(user)) {
    redirect("/pending-approval");
  }

  const { events } = await getDashboardRallyEvents();

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
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-64 w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.055] lg:block"
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
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
            Rally Events
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Your rally memories, newest first.
          </p>
        </div>
        {events.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <RallyEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyDashboardSection
            title="No rally events yet."
            description="Create a rally event to start building your memories."
          />
        )}
      </section>
    </div>
  );
}
