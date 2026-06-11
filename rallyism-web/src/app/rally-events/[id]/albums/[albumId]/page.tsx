import Link from "next/link";
import { notFound } from "next/navigation";

import { bulkDeletePhotosAction } from "@/app/rally-events/[id]/albums/[albumId]/bulk-photo-actions";
import { bulkDeleteVideosAction } from "@/app/rally-events/[id]/albums/[albumId]/bulk-video-actions";
import {
  AlbumMediaGrid,
  type AlbumMediaGridItem,
} from "@/components/rally-events/album-media-grid";
import { AlbumPhotoViewer } from "@/components/rally-events/album-photo-viewer";
import { RallyAccessDenied } from "@/components/rally-events/rally-access-denied";
import { formatDate } from "@/components/rally-events/rally-event-format";
import { canContribute } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getAlbumMediaGalleryDetails,
  userCanManageEvent,
  userCanManagePhoto,
  userCanManageVideo,
  type AlbumMediaFilter,
} from "@/services/rally-events";

type AlbumPageProps = {
  params: Promise<{
    id: string;
    albumId: string;
  }>;
  searchParams?: Promise<{
    filter?: string;
    page?: string;
    uploadStatus?: string;
    uploaded?: string;
    failed?: string;
    uploadFailedDetails?: string;
    uploadWarnings?: string;
    bulkDeleted?: string;
    bulkError?: string;
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

function getMediaGridHref(href: string) {
  return `${href}#media-grid`;
}

function getUploadResultMessage(searchParams: Awaited<AlbumPageProps["searchParams"]>) {
  const status = searchParams?.uploadStatus;

  if (!status) {
    return null;
  }

  const uploaded = Number(searchParams?.uploaded ?? 0);
  const failed = Number(searchParams?.failed ?? 0);
  const uploadedText = `${uploaded} photo${uploaded === 1 ? "" : "s"} uploaded`;
  const failedText =
    failed > 0 ? `, ${failed} file${failed === 1 ? "" : "s"} failed` : "";

  if (status === "completed") {
    return {
      tone: "success" as const,
      text: `${uploadedText}.`,
      failedDetails: getUploadFailedDetails(searchParams?.uploadFailedDetails),
      warnings: getUploadWarnings(searchParams?.uploadWarnings),
    };
  }

  if (status === "completed_with_errors") {
    return {
      tone: "warning" as const,
      text: `${uploadedText}${failedText}.`,
      failedDetails: getUploadFailedDetails(searchParams?.uploadFailedDetails),
      warnings: getUploadWarnings(searchParams?.uploadWarnings),
    };
  }

  if (status === "failed") {
    return {
      tone: "error" as const,
      text: "No photos were uploaded. Check the file format and size, then try again.",
      failedDetails: getUploadFailedDetails(searchParams?.uploadFailedDetails),
      warnings: getUploadWarnings(searchParams?.uploadWarnings),
    };
  }

  return null;
}

function getUploadFailedDetails(value: string | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "filename" in item &&
          "error" in item &&
          typeof item.filename === "string" &&
          typeof item.error === "string"
        ) {
          return {
            filename: item.filename.slice(0, 255),
            error: item.error.slice(0, 300),
          };
        }

        return null;
      })
      .filter((item): item is { filename: string; error: string } => Boolean(item));
  } catch {
    return [];
  }
}

function getUploadWarnings(value: string | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "filename" in item &&
          "message" in item &&
          typeof item.filename === "string" &&
          typeof item.message === "string"
        ) {
          return {
            filename: item.filename.slice(0, 255),
            message: item.message.slice(0, 350),
          };
        }

        return null;
      })
      .filter((item): item is { filename: string; message: string } => Boolean(item));
  } catch {
    return [];
  }
}

function getBulkDeleteResultMessage(
  searchParams: Awaited<AlbumPageProps["searchParams"]>,
) {
  if (searchParams?.bulkError) {
    return {
      tone: "error" as const,
      text: searchParams.bulkError,
    };
  }

  const deleted = Number(searchParams?.bulkDeleted ?? 0);

  if (deleted > 0) {
    return {
      tone: "success" as const,
      text: `${deleted} photo${deleted === 1 ? "" : "s"} deleted.`,
    };
  }

  return null;
}

function getResultClass(tone: "success" | "warning" | "error") {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (tone === "warning") {
    return "border-rally-orange-border bg-rally-orange-soft text-rally-orange";
  }

  return "border-red-200 bg-red-50 text-red-800";
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

  const { album, event, mediaPage } = result;
  const canManageEvent = userCanManageEvent(event, user);
  const canBrowseTags = canContribute(user);
  const uploadResultMessage = getUploadResultMessage(resolvedSearchParams);
  const bulkDeleteResultMessage = getBulkDeleteResultMessage(resolvedSearchParams);
  const mediaPageHref = getMediaGridHref(
    getAlbumPageHref({
      rallyEventId,
      albumId: parsedAlbumId,
      filter: mediaPage.filter,
      page: mediaPage.currentPage,
    }),
  );
  const galleryItems: AlbumMediaGridItem[] = mediaPage.items.map((item) => {
    const canManage =
      item.type === "video"
        ? userCanManageVideo(event, item, user)
        : userCanManagePhoto(event, item, user);
    const viewerHref = getAlbumPageHref({
      rallyEventId,
      albumId: parsedAlbumId,
      filter: mediaPage.filter,
      page: mediaPage.currentPage,
      photoId: item.id,
    });

    return {
      id: item.id,
      albumId: item.albumId,
      type: item.type,
      title: item.title,
      thumbnailImageUrl: item.thumbnailImageUrl,
      displayImageUrl: item.displayImageUrl,
      originalImageUrl: item.originalImageUrl,
      youtubeThumbnailUrl: item.youtubeThumbnailUrl,
      youtubeUrl: item.youtubeUrl,
      canManage,
      viewerHref,
      editHref:
        item.type === "video"
          ? `/rally-events/${rallyEventId}/albums/${item.albumId}/videos/${item.id}/edit`
          : `/rally-events/${rallyEventId}/albums/${item.albumId}/photos/${item.id}/edit?${new URLSearchParams(
              { returnTo: mediaPageHref },
            ).toString()}`,
    };
  });
  const viewerPhotos = result.viewerPhotos.map((item) => ({
    id: item.id,
    title: item.title,
    caption: item.caption,
    thumbnailImageUrl: item.thumbnailImageUrl,
    displayImageUrl: item.displayImageUrl,
    originalImageUrl: item.originalImageUrl,
    tags: canBrowseTags ? item.tags : [],
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/rally-events/${rallyEventId}`}
        className="inline-flex h-10 items-center justify-center rounded-md border border-rally-orange-border bg-white px-4 text-sm font-semibold text-rally-blue shadow-sm transition hover:bg-rally-orange-soft hover:text-rally-blue-hover"
      >
        Back to {event.rallyName}
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
            <p className="text-sm font-semibold uppercase text-rally-blue">Album</p>
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
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Media", value: album.mediaCount },
              { label: "Photos", value: album.photosCount },
              { label: "Videos", value: album.videosCount },
            ].map((stat) => (
              <span
                key={stat.label}
                className="rounded-md border border-rally-orange-border bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                {stat.label}{" "}
                <span className="font-bold text-zinc-900">{stat.value}</span>
              </span>
            ))}
          </div>
          {canManageEvent ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}/photos/upload`}
                className="inline-flex h-10 items-center justify-center rounded-md bg-rally-orange px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-orange/90"
              >
                Upload photos
              </Link>
              <Link
                href={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}/videos/new`}
                className="inline-flex h-10 items-center justify-center rounded-md bg-rally-orange px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-orange/90"
              >
                Add YouTube video
              </Link>
              <Link
                href={`/rally-events/${rallyEventId}/albums/${parsedAlbumId}/edit`}
                className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover"
              >
                Edit album
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {uploadResultMessage ? (
        <div
          className={`space-y-3 rounded-md border px-4 py-3 text-sm font-medium ${getResultClass(uploadResultMessage.tone)}`}
        >
          <p>{uploadResultMessage.text}</p>
          {uploadResultMessage.failedDetails.length > 0 ? (
            <div className="space-y-2">
              <p className="font-semibold">Failed files</p>
              <ul className="space-y-1">
                {uploadResultMessage.failedDetails.map((item) => (
                  <li key={`${item.filename}-${item.error}`}>
                    <span className="font-semibold">{item.filename}</span>:{" "}
                    {item.error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {uploadResultMessage.warnings.length > 0 ? (
            <div className="space-y-2">
              <p className="font-semibold">Warnings</p>
              <ul className="space-y-1">
                {uploadResultMessage.warnings.map((item) => (
                  <li key={`${item.filename}-${item.message}`}>
                    {item.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {bulkDeleteResultMessage ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-medium ${getResultClass(bulkDeleteResultMessage.tone)}`}
        >
          {bulkDeleteResultMessage.text}
        </div>
      ) : null}

      <section id="media" className="scroll-mt-6 space-y-5">
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
                href={getMediaGridHref(
                  getAlbumPageHref({
                    rallyEventId,
                    albumId: parsedAlbumId,
                    filter: option.value,
                  }),
                )}
                className={`flex-1 cursor-pointer rounded px-3 py-1.5 text-center text-sm font-semibold transition sm:flex-none ${
                  mediaPage.filter === option.value
                    ? "bg-rally-blue text-white"
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
          <div id="media-grid" className="scroll-mt-6">
            <AlbumMediaGrid
              albumId={parsedAlbumId}
              bulkDeletePhotosAction={bulkDeletePhotosAction}
              bulkDeleteVideosAction={bulkDeleteVideosAction}
              items={galleryItems}
              rallyEventId={rallyEventId}
            />
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
