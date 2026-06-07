import Link from "next/link";
import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import { searchTags } from "@/services/rally-events";

type TagsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function TagsPage({ searchParams }: TagsPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([
    requireContributor("/tags"),
    searchParams,
  ]);

  if (!user) {
    redirect("/pending-approval");
  }

  const query = resolvedSearchParams?.q?.trim() ?? "";
  const tagResults = await searchTags({ query, limit: 48 });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="inline-flex text-sm font-semibold text-red-700 hover:text-red-800"
      >
        Back to dashboard
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-red-700">Tags</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Browse photo tags
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Find private rally memories by driver, team, place or moment.
        </p>
      </section>

      <section className="space-y-5">
        <form className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row">
          <input
            className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            defaultValue={query}
            name="q"
            placeholder="Search tags, for example Lappi"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Search
          </button>
        </form>

        {tagResults.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tagResults.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-red-200 hover:text-red-700"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-950">
              No tags found.
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Try another search term or add tags to photos from the edit page.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
