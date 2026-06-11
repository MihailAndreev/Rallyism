import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import { searchTags } from "@/services/rally-events";

type TagsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function getTagGroupKey(name: string) {
  const firstLetter = name.trim().charAt(0).toLocaleUpperCase();

  return /^[A-ZА-Я]$/u.test(firstLetter) ? firstLetter : "#";
}

function groupTagsByLetter(tags: Awaited<ReturnType<typeof searchTags>>) {
  const groups = new Map<string, typeof tags>();

  for (const tag of tags) {
    const key = getTagGroupKey(tag.name);
    const current = groups.get(key) ?? [];

    current.push(tag);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).sort(([letterA], [letterB]) =>
    letterA.localeCompare(letterB),
  );
}

export default async function TagsPage({ searchParams }: TagsPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([
    requireContributor("/tags"),
    searchParams,
  ]);

  if (!user) {
    redirect("/pending-approval");
  }

  const query = resolvedSearchParams?.q?.trim() ?? "";
  const tagResults = await searchTags({ query });
  const tagGroups = groupTagsByLetter(tagResults);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
      >
        Back to Dashboard
      </Link>

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
            Tags
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-zinc-950">
            Browse photo tags
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            Find private rally memories by driver, team, place or moment.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <form className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row">
          <input
            className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-rally-blue focus:ring-2 focus:ring-rally-blue/20"
            defaultValue={query}
            name="q"
            placeholder="Search tags, for example Lappi"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-md bg-rally-blue px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
          >
            Search
          </button>
        </form>

        {tagGroups.length > 0 ? (
          <div className="space-y-5">
            <nav
              aria-label="Tag alphabet"
              className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
            >
              {tagGroups.map(([letter]) => (
                <a
                  key={letter}
                  href={`#tags-${letter}`}
                  className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-rally-orange-border bg-white px-2 text-sm font-semibold text-rally-blue transition hover:bg-rally-orange-soft"
                >
                  {letter}
                </a>
              ))}
            </nav>

            <div className="space-y-6">
              {tagGroups.map(([letter, tags]) => (
                <section
                  key={letter}
                  id={`tags-${letter}`}
                  className="scroll-mt-6 space-y-3"
                >
                  <h2 className="text-xl font-semibold tracking-normal text-zinc-950">
                    {letter}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/tags/${tag.slug}`}
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-rally-blue-border hover:text-rally-blue"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
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
