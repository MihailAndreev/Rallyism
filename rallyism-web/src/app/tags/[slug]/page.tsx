import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import { getTaggedPhotosPage } from "@/services/rally-events";

type TagDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    page?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getPhotoImageUrl(item: {
  thumbnailImageUrl: string | null;
  displayImageUrl: string | null;
  originalImageUrl: string | null;
}) {
  return item.thumbnailImageUrl ?? item.displayImageUrl ?? item.originalImageUrl;
}

export default async function TagDetailsPage({
  params,
  searchParams,
}: TagDetailsPageProps) {
  const { slug } = await params;
  const [resolvedSearchParams, user] = await Promise.all([
    searchParams,
    requireContributor(`/tags/${slug}`),
  ]);

  if (!user) {
    redirect("/pending-approval");
  }

  const page = parsePage(resolvedSearchParams?.page);
  const result = await getTaggedPhotosPage({
    slug,
    currentUser: user,
    page,
    pageSize: 24,
  });

  if (result.status === "not-found") {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/tags"
        className="inline-flex text-sm font-semibold text-red-700 hover:text-red-800"
      >
        Back to tags
      </Link>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase text-red-700">Tag</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          {result.tag.name}
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600 sm:text-base">
          {result.totalPhotos} photo{result.totalPhotos === 1 ? "" : "s"} found.
        </p>
      </section>

      {result.items.length > 0 ? (
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-6">
            {result.items.map((item) => {
              const imageUrl = getPhotoImageUrl(item);

              return (
                <Link
                  key={item.id}
                  href={`/rally-events/${item.rallyEventId}/albums/${item.albumId}?photo=${item.id}`}
                  className="group overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm transition hover:border-red-200 hover:shadow-md"
                >
                  <div className="aspect-square bg-zinc-100">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={item.title ?? "Tagged photo"}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.025]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-3 text-center text-sm font-semibold text-zinc-500">
                        Photo
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 px-2 py-2">
                    <p className="truncate text-xs font-semibold text-zinc-900">
                      {item.eventTitle}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {item.albumTitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
          <h2 className="text-lg font-semibold text-zinc-950">
            No photos for this tag.
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Photos tagged with {result.tag.name} will appear here.
          </p>
        </div>
      )}

      {result.totalPhotos > 0 ? (
        <nav
          aria-label="Tagged photos pagination"
          className="flex items-center justify-between border-t border-zinc-200 pt-6"
        >
          {result.hasPreviousPage ? (
            <Link
              href={`/tags/${result.tag.slug}?page=${result.currentPage - 1}`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-400">
              Previous
            </span>
          )}
          <p className="text-sm text-zinc-500">
            Page {result.currentPage} of {result.totalPages}
          </p>
          {result.hasNextPage ? (
            <Link
              href={`/tags/${result.tag.slug}?page=${result.currentPage + 1}`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-4 text-sm font-semibold text-zinc-400">
              Next
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
