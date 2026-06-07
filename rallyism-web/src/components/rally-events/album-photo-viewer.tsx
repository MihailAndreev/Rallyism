"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { AlbumMediaItem } from "@/services/rally-events";

type AlbumPhotoViewerPhoto = Pick<
  AlbumMediaItem,
  | "id"
  | "title"
  | "caption"
  | "thumbnailImageUrl"
  | "displayImageUrl"
  | "originalImageUrl"
  | "tags"
>;

function getViewerImageUrl(photo: AlbumPhotoViewerPhoto) {
  return photo.displayImageUrl ?? photo.originalImageUrl ?? photo.thumbnailImageUrl;
}

function getPhotoLabel(photo: AlbumPhotoViewerPhoto) {
  return photo.title ?? "Untitled photo";
}

export function AlbumPhotoViewer({
  photos,
}: {
  photos: AlbumPhotoViewerPhoto[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedPhotoId = Number(searchParams.get("photo"));
  const selectedIndex = useMemo(
    () =>
      photos.findIndex(
        (photo) =>
          Number.isInteger(selectedPhotoId) && photo.id === selectedPhotoId,
      ),
    [photos, selectedPhotoId],
  );
  const selectedPhoto = selectedIndex >= 0 ? photos[selectedIndex] : null;
  const hasPrevious = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < photos.length - 1;

  const getHrefForPhoto = useCallback((photoId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (photoId) {
      params.set("photo", String(photoId));
    } else {
      params.delete("photo");
    }

    const query = params.toString();

    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const closeViewer = useCallback(() => {
    router.push(getHrefForPhoto(null), { scroll: false });
  }, [getHrefForPhoto, router]);

  const showPhotoAtIndex = useCallback((nextIndex: number) => {
    const photo = photos[nextIndex];

    if (!photo) {
      return;
    }

    router.push(getHrefForPhoto(photo.id), { scroll: false });
  }, [getHrefForPhoto, photos, router]);

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedPhoto]);

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
      }

      if (event.key === "ArrowLeft" && hasPrevious) {
        event.preventDefault();
        showPhotoAtIndex(selectedIndex - 1);
      }

      if (event.key === "ArrowRight" && hasNext) {
        event.preventDefault();
        showPhotoAtIndex(selectedIndex + 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    closeViewer,
    hasNext,
    hasPrevious,
    selectedIndex,
    selectedPhoto,
    showPhotoAtIndex,
  ]);

  if (!selectedPhoto) {
    return null;
  }

  const imageUrl = getViewerImageUrl(selectedPhoto);

  return (
    <div
      aria-labelledby="album-photo-viewer-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex bg-zinc-950 text-white"
      role="dialog"
    >
      <div className="flex min-h-0 w-full flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-red-300">
              Photo {selectedIndex + 1} / {photos.length}
            </p>
            <h2
              id="album-photo-viewer-title"
              className="mt-1 line-clamp-1 break-words text-base font-semibold sm:text-lg"
            >
              {getPhotoLabel(selectedPhoto)}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            aria-label="Close photo viewer"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            type="button"
            onClick={closeViewer}
          >
            Close
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]">
          <div className="relative min-h-0 px-3 py-4 sm:px-6">
            <div className="flex h-full min-h-0 items-center justify-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={getPhotoLabel(selectedPhoto)}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-6 text-center text-sm text-zinc-300">
                  Full photo image is not available.
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute inset-x-3 top-1/2 hidden -translate-y-1/2 justify-between sm:flex sm:inset-x-6">
              <button
                aria-label="Previous photo"
                className="pointer-events-auto inline-flex h-12 min-w-24 items-center justify-center rounded-md border border-white/20 bg-black/45 px-4 text-sm font-semibold text-white transition hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-35"
                type="button"
                disabled={!hasPrevious}
                onClick={() => showPhotoAtIndex(selectedIndex - 1)}
              >
                Previous
              </button>
              <button
                aria-label="Next photo"
                className="pointer-events-auto inline-flex h-12 min-w-24 items-center justify-center rounded-md border border-white/20 bg-black/45 px-4 text-sm font-semibold text-white transition hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-35"
                type="button"
                disabled={!hasNext}
                onClick={() => showPhotoAtIndex(selectedIndex + 1)}
              >
                Next
              </button>
            </div>
          </div>

          <footer className="shrink-0 border-t border-white/10 bg-zinc-950 px-4 py-3 sm:px-6">
            {selectedPhoto.caption ? (
              <p className="mx-auto max-w-4xl break-words text-sm leading-6 text-zinc-200">
                {selectedPhoto.caption}
              </p>
            ) : null}
            {selectedPhoto.tags.length > 0 ? (
              <div className="mx-auto mt-3 flex max-w-4xl flex-wrap gap-2">
                {selectedPhoto.tags.map((tag) => (
                  <a
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-100 transition hover:bg-white/20"
                  >
                    {tag.name}
                  </a>
                ))}
              </div>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-3 sm:hidden">
              <button
                aria-label="Previous photo"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
                type="button"
                disabled={!hasPrevious}
                onClick={() => showPhotoAtIndex(selectedIndex - 1)}
              >
                Previous
              </button>
              <button
                aria-label="Next photo"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
                type="button"
                disabled={!hasNext}
                onClick={() => showPhotoAtIndex(selectedIndex + 1)}
              >
                Next
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
