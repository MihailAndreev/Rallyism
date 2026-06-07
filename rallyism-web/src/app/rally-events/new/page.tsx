import Link from "next/link";
import { redirect } from "next/navigation";

import { createRallyEventAction } from "@/app/rally-events/new/actions";
import { RallyEventForm } from "@/components/rally-events/rally-event-form";
import { isAdmin, requireContributor } from "@/lib/auth/authorization";

type NewRallyEventPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewRallyEventPage({
  searchParams,
}: NewRallyEventPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([
    requireContributor("/rally-events/new"),
    searchParams,
  ]);

  if (!user) {
    redirect("/pending-approval");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="inline-flex text-sm font-semibold text-rally-blue hover:text-rally-blue-hover"
      >
        Back to Dashboard
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">
          Rally event
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Create rally event
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Start a new rally memory gallery. Albums and media can be added in
          later steps.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <RallyEventForm
          action={createRallyEventAction}
          cancelHref="/dashboard"
          currentUserIsAdmin={isAdmin(user)}
          error={resolvedSearchParams?.error}
          submitLabel="Create event"
        />
      </section>
    </div>
  );
}
