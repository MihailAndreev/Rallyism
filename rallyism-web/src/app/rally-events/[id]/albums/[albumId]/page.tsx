import Link from "next/link";
import { notFound } from "next/navigation";

import { AlbumPhotoViewer } from "@/components/rally-events/album-photo-viewer";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { formatDate } from "@/components/rally-events/rally-event-format";
import { RallyEventStats } from "@/components/rally-events/rally-event-stats";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getAlbumMediaGalleryDetails,
  type AlbumMediaFilter,
  type AlbumMediaItem,
} from "@/services/rally-events";

type AlbumPageProps = {
  params: Promise<{
    id: string;
    albumId: string;
  }>;
  searchParams?: Promise<{
    filter?: string;
    page?: string;
  }>;
};

const filters: { value: AlbumMediaFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "photos", label: "Photos" },
  { value: "videos", label: "Videos" },
];

function parseFilter(value: string | undefined): AlbumMediaFilter {
  if (value === "photos" || value === "videos") {
    return value;
  }

  return "all";
}

function parsePage(value: string | undefined) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getAlbumPageHref(input: {
  rallyEventId: number;
  albumId: number;
  filter: AlbumMediaFilter;
  page?: number;
  photoId?: number;
}) {
  const params = new URLSearchParams();

  if (input.filter !== "all") {
    params.set("filter", input.filter);
  }

  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }

  if (input.photoId) {
    params.set("photo", String(input.photoId));
  }

  const query = params.toString();

  return `/rally-events/${input.rallyEventId}/albums/${input.albumId}${
    query ? `?${query}` : ""
  }`;
}

function getPhotoImageUrl(item: AlbumMediaItem) {
  return item.thumbnailImageUrl ?? item.displayImageUrl ?? item.originalImageUrl;
}

function getMediaTitle(item: AlbumMediaItem) {
  return item.title ?? (item.type === "video" ? "Untitled video" : "Untitled photo");
}

function PhotoCard({
  item,
  href,
}: {
  item: AlbumMediaItem;
  href: string;
}) {
  const imageUrl = getPhotoImageUrl(item);

  return (
    <Link
      href={href}
      scroll={false}
      className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full bg-zinc-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={getMediaTitle(item)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-zinc-500">
            Photo
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-2 p-4">
        <span className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600">
          Photo
        </span>
        <h2 className="line-clamp-2 break-words text-base font-semibold text-zinc-950">
          {getMediaTitle(item)}
        </h2>
        {item.caption ? (
          <p className="line-clamp-3 break-words text-sm leading-6 text-zinc-600">
            {item.caption}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function VideoCard({ item }: { item: AlbumMediaItem }) {
  const content = (
    <>
      <div className="aspect-[4/3] w-full bg-zinc-100">
        {item.youtubeThumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.youtubeThumbnailUrl}
            alt={getMediaTitle(item)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-zinc-500">
            YouTube video
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-2 p-4">
        <span className="inline-flex rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
          Video
        </span>
        <h2 className="line-clamp-2 break-words text-base font-semibold text-zinc-950">
          {getMediaTitle(item)}
        </h2>
        {item.caption ? (
          <p className="line-clamp-3 break-words text-sm leading-6 text-zinc-600">
            {item.caption}
          </p>
        ) : null}
      </div>
    </>
  );

  if (!item.youtubeUrl) {
    return (
      <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {content}
      </article>
    );
  }

  return (
    <a
      href={item.youtubeUrl}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      {content}
      <span className="sr-only">Open video on YouTube</span>
    </a>
  );
}

function MediaCard({
  item,
  href,
}: {
  item: AlbumMediaItem;
  href: string;
}) {
  return item.type === "video" ? (
    <VideoCard item={item} />
  ) : (
    <PhotoCard item={item} href={href} />
  );
}

export default async function AlbumPage({
  params,
  searchParams,
}: AlbumPageProps) {
  const [{ id, albumId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const user = await getCurrentUser();

  const rallyEventId = Number(id);
  const parsedAlbumId = Number(albumId);

  if (!Number.isInteger(rallyEventId) || !Number.isInteger(parsedAlbumId)) {
    notFound();
  }

  const filter = parseFilter(resolvedSearchParams?.filter);
  const page = parsePage(resolvedSearchParams?.page);
  const result = await getAlbumMediaGalleryDetails({
    rallyEventId,
    albumId: parsedAlbumId,
    currentUser: user,
    filter,
    page,
    pageSize: 12,
  });

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "access-denied") {
    return (
      <RallyAccessDenied
        backHref={user ? "/dashboard" : "/"}
        backLabel={user ? "Back to Dashboard" : "Back to Rallyism"}
      />
    );
  }

  const { album, mediaPage } = result;
  const viewerPhotos = mediaPage.items
    .filter((item) => item.type === "photo")
    .map((item) => ({
      id: item.id,
      title: item.title,
      caption: item.caption,
      thumbnailImageUrl: item.thumbnailImageUrl,
      displayImageUrl: item.displayImageUrl,
      originalImageUrl: item.originalImageUrl,
    }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/rally-events/${rallyEventId}`}
        className="inline-flex text-sm font-semibold text-red-700 hover:text-red-800"
      >
        Back to rally event
      </Link>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {album.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.coverImageUrl}
            alt={`${album.title} cover`}
            className="h-56 w-full object-cover sm:h-72"
          />
        ) : null}
        <div className="space-y-5 p-6 sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase text-red-700">Album</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
              {album.title}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {formatDate(album.albumDate)}
            </p>
          </div>
          {album.description ? (
            <p className="max-w-3xl text-base leading-7 text-zinc-600">
              {album.description}
            </p>
          ) : null}
          <RallyEventStats
            albumsCount={0}
            mediaCount={album.mediaCount}
            photosCount={album.photosCount}
            videosCount={album.videosCount}
            showAlbums={false}
          />
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
              Media
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Page {mediaPage.currentPage} of {mediaPage.totalPages}
            </p>
          </div>
          <nav
            aria-label="Album media filters"
            className="inline-flex w-full rounded-md border border-zinc-200 bg-white p-1 sm:w-auto"
          >
            {filters.map((option) => (
              <Link
                key={option.value}
                href={getAlbumPageHref({
                  rallyEventId,
                  albumId: parsedAlbumId,
                  filter: option.value,
                })}
                className={`flex-1 rounded px-3 py-1.5 text-center text-sm font-semibold transition sm:flex-none ${
                  mediaPage.filter === option.value
                    ? "bg-red-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </div>

        {album.mediaCount === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-950">
              No media in this album yet.
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Photos and YouTube videos will appear here when they are added.
            </p>
          </div>
        ) : mediaPage.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mediaPage.items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                href={getAlbumPageHref({
                  rallyEventId,
                  albumId: parsedAlbumId,
                  filter: mediaPage.filter,
                  page: mediaPage.currentPage,
                  photoId: item.id,
                })}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-950">
              No media for this filter.
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Try another media type to keep browsing this album.
            </p>
          </div>
        )}
      </section>

      {album.mediaCount > 0 ? (
        <nav
          aria-label="Album media pagination"
          className="flex items-center justify-between border-t border-zinc-200 pt-6"
        >
          {mediaPage.hasPreviousPage ? (
            <Link
              href={getAlbumPageHref({
                rallyEventId,
                albumId: parsedAlbumId,
                filter: mediaPage.filter,
                page: mediaPage.currentPage - 1,
              })}
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
            {mediaPage.totalMedia} item{mediaPage.totalMedia === 1 ? "" : "s"}
          </p>
          {mediaPage.hasNextPage ? (
            <Link
              href={getAlbumPageHref({
                rallyEventId,
                albumId: parsedAlbumId,
                filter: mediaPage.filter,
                page: mediaPage.currentPage + 1,
              })}
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

      <AlbumPhotoViewer photos={viewerPhotos} />
    </div>
  );
}
