import { redirect } from "next/navigation";

import { EmptyDashboardSection } from "@/components/rally-events/empty-dashboard-section";
import { RallyEventCard } from "@/components/rally-events/rally-event-card";
import { canContribute } from "@/lib/auth/authorization";
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

  const { activeEvents, pastEvents } = await getDashboardRallyEvents();

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
          <p className="text-sm text-zinc-500">
            Signed in as {user.name || user.email}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
            Upcoming & Current Rally Events
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Sorted by the first rally to come.
          </p>
        </div>
        {activeEvents.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {activeEvents.map((event) => (
              <RallyEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyDashboardSection
            title="No upcoming rally events yet."
            description="Upcoming and current rally events will appear here."
          />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
            Rally Memories Archive
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Past rally events, newest memories first.
          </p>
        </div>
        {pastEvents.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pastEvents.map((event) => (
              <RallyEventCard key={event.id} event={event} compact />
            ))}
          </div>
        ) : (
          <EmptyDashboardSection
            title="No rally memories in the archive yet."
            description="Past rally events will appear here after they are added."
          />
        )}
      </section>
    </div>
  );
}
