import { redirect } from "next/navigation";
import Link from "next/link";

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
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-red-700">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
              Welcome to Rallyism
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              Browse rally events and open the memories that are ready for the
              next step.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <p className="text-sm text-zinc-500">
              Signed in as {user.name || user.email}
            </p>
            <Link
              href="/rally-events/new"
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
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
