import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  deleteRallyEventAction,
  updateRallyEventAction,
} from "@/app/rally-events/[id]/edit/actions";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { RallyEventForm } from "@/components/rally-events/rally-event-form";
import { isAdmin, requireContributor } from "@/lib/auth/authorization";
import { getEditableRallyEvent } from "@/services/rally-events";

type EditRallyEventPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditRallyEventPage({
  params,
  searchParams,
}: EditRallyEventPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const user = await requireContributor(`/rally-events/${id}/edit`);

  if (!user) {
    redirect("/pending-approval");
  }

  const eventId = Number(id);

  if (!Number.isInteger(eventId)) {
    notFound();
  }

  const result = await getEditableRallyEvent(eventId, user);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "access-denied") {
    return (
      <RallyAccessDenied
        backHref={`/rally-events/${eventId}`}
        backLabel="Back to rally event"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/rally-events/${eventId}`}
        className="inline-flex text-sm font-semibold text-rally-blue hover:text-rally-blue-hover"
      >
        Back to rally event
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">
          Rally event
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Edit rally event
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Update event details, visibility and gallery presentation.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <RallyEventForm
          action={updateRallyEventAction}
          cancelHref={`/rally-events/${eventId}`}
          currentUserIsAdmin={isAdmin(user)}
          deleteAction={deleteRallyEventAction}
          error={resolvedSearchParams?.error}
          event={result.event}
          eventId={eventId}
          submitLabel="Save changes"
        />
      </section>
    </div>
  );
}
