import Image from "next/image";
import Link from "next/link";

import {
  deleteTagAction,
  updateTagAction,
} from "@/app/admin/tags/actions";
import { requireAdmin } from "@/lib/auth/authorization";
import { getAdminTags } from "@/services/rally-events";

type AdminTagsPageProps = {
  searchParams?: Promise<{
    message?: string;
    messageType?: string;
  }>;
};

function AdminAccessDenied() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-rally-blue">
          Admin access required
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950">
          You do not have access to tag management.
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          Admin pages are only available to Rallyism admin users.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-rally-blue px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
        >
          Back to Dashboard
        </Link>
      </section>
    </div>
  );
}

function AdminLinks() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
      >
        Back to Dashboard
      </Link>
      <Link
        href="/admin/users"
        className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
      >
        User approvals
      </Link>
      <Link
        href="/admin/rally-events"
        className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
      >
        Rally events
      </Link>
      <Link
        href="/admin/tags"
        className="inline-flex h-10 items-center justify-center rounded-md border border-rally-orange-border bg-rally-orange-soft px-4 text-sm font-semibold text-zinc-950 shadow-sm"
      >
        Tags
      </Link>
    </div>
  );
}

export default async function AdminTagsPage({
  searchParams,
}: AdminTagsPageProps) {
  const [admin, resolvedSearchParams] = await Promise.all([
    requireAdmin("/admin/tags"),
    searchParams,
  ]);

  if (!admin) {
    return <AdminAccessDenied />;
  }

  const tags = await getAdminTags();
  const message = resolvedSearchParams?.message;
  const messageType =
    resolvedSearchParams?.messageType === "success" ? "success" : "error";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <AdminLinks />

      <section className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Image
          src="/images/rallyism-logo.png"
          alt=""
          width={260}
          height={282}
          priority
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-56 w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.055] lg:block"
        />
        <div className="relative min-w-0">
          <span className="inline-flex rounded-md border border-rally-orange-border bg-white px-2.5 py-1 text-xs font-semibold uppercase text-rally-blue">
            Admin
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-zinc-950">
            Tags
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            Edit misspelled tags or remove tags that should no longer be used.
          </p>
        </div>
      </section>

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            messageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
            All tags
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            {tags.length} tag{tags.length === 1 ? "" : "s"} in the library.
          </p>
        </div>

        {tags.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px_minmax(260px,1fr)] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 lg:grid">
              <div>Tag</div>
              <div>Slug</div>
              <div>Media</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-zinc-200">
              {tags.map((tag) => (
                <article
                  key={tag.id}
                  className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px_minmax(260px,1fr)] lg:items-center"
                >
                  <div className="min-w-0">
                    <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Tag
                    </span>
                    <Link
                      href={`/tags/${tag.slug}`}
                      className="break-words text-sm font-semibold text-rally-blue hover:text-rally-blue-hover"
                    >
                      {tag.name}
                    </Link>
                  </div>
                  <div className="min-w-0">
                    <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Slug
                    </span>
                    <p className="break-words text-sm text-zinc-600">
                      {tag.slug}
                    </p>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Media
                    </span>
                    <span className="inline-flex rounded-md border border-rally-orange-border bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                      <strong className="mr-1 text-zinc-950">
                        {tag.mediaCount}
                      </strong>
                      media
                    </span>
                  </div>
                  <div>
                    <span className="mb-2 block text-xs font-semibold uppercase text-zinc-500 lg:hidden">
                      Actions
                    </span>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <form
                        action={updateTagAction}
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        <input type="hidden" name="tagId" value={tag.id} />
                        <input
                          name="name"
                          defaultValue={tag.name}
                          maxLength={80}
                          className="h-9 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 shadow-sm outline-none transition focus:border-rally-blue focus:ring-2 focus:ring-rally-blue-soft"
                        />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center justify-center rounded-md bg-rally-blue px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
                        >
                          Save
                        </button>
                      </form>
                      <form action={deleteTagAction}>
                        <input type="hidden" name="tagId" value={tag.id} />
                        <button
                          type="submit"
                          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 sm:w-auto"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-950">
              No tags yet.
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Tags appear here after they are added to media.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
