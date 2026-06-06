import Link from "next/link";

export function RallyAccessDenied({
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-red-700">
          Access denied
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950">
          You do not have access to this rally event.
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          Private rally memories are only visible to their creator and admin
          users.
        </p>
        <Link
          href={backHref}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          {backLabel}
        </Link>
      </section>
    </div>
  );
}
