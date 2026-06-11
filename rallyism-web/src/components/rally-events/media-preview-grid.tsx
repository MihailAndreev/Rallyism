"use client";

import { useEffect, useMemo, useState } from "react";

import type { RallyEventMediaPreviewItem } from "@/services/rally-events";

const SLIDE_INTERVAL_MS = 3000;
const MAX_PREVIEW_ITEMS = 12;

function getImageUrl(item: RallyEventMediaPreviewItem) {
  if (item.type === "video") {
    return item.youtubeThumbnailUrl;
  }

  return item.thumbnailImageUrl ?? item.displayImageUrl ?? item.originalImageUrl;
}

function getOrderedItems(
  items: RallyEventMediaPreviewItem[],
  offset: number,
) {
  if (offset === 0) {
    return items;
  }

  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function MediaPreviewStrip({
  items,
}: {
  items: RallyEventMediaPreviewItem[];
}) {
  const [offset, setOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const previewItems = useMemo(
    () =>
      items
        .filter((item) => Boolean(getImageUrl(item)))
        .slice(0, MAX_PREVIEW_ITEMS),
    [items],
  );
  const canSlide = previewItems.length > 5;
  const orderedItems = useMemo(
    () => getOrderedItems(previewItems, offset),
    [offset, previewItems],
  );

  useEffect(() => {
    if (!canSlide || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setOffset((currentOffset) => (currentOffset + 1) % previewItems.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [canSlide, isPaused, previewItems.length]);

  if (previewItems.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Media preview"
      className="overflow-hidden"
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="media-preview-strip-track flex">
        {orderedItems.map((item, index) => {
          const imageUrl = getImageUrl(item);

          return (
            <article
              key={`${item.id}-${index}`}
              className="media-preview-strip-card relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl ?? ""}
                alt={item.title ?? `${item.type} preview`}
                className="h-full w-full object-cover"
              />
              {item.type === "video" ? (
                <span className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-zinc-700 shadow-sm">
                  Video
                </span>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export { MediaPreviewStrip as MediaPreviewGrid };
