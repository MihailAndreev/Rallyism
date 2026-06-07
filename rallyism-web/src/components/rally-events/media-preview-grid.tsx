"use client";

import { useMemo, useState } from "react";

import type { RallyEventMediaPreviewItem } from "@/services/rally-events";

type MediaFilter = "all" | "photo" | "video";

function getImageUrl(item: RallyEventMediaPreviewItem) {
  if (item.type === "video") {
    return item.youtubeThumbnailUrl;
  }

  return item.thumbnailImageUrl ?? item.displayImageUrl ?? item.originalImageUrl;
}

export function MediaPreviewGrid({
  items,
}: {
  items: RallyEventMediaPreviewItem[];
}) {
  const [filter, setFilter] = useState<MediaFilter>("all");
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (filter === "all") {
          return true;
        }

        return item.type === filter;
      }),
    [filter, items],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-zinc-950">
            Media Preview
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            A small preview of the first rally memories.
          </p>
        </div>
        <div className="flex rounded-md border border-zinc-200 bg-white p-1">
          {[
            { value: "all", label: "All" },
            { value: "photo", label: "Photos" },
            { value: "video", label: "Videos" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value as MediaFilter)}
              className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
                filter === option.value
                  ? "bg-rally-blue text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const imageUrl = getImageUrl(item);

            return (
              <article
                key={item.id}
                className="relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm"
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={item.title ?? `${item.type} preview`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-zinc-500">
                    {item.type === "video" ? "Video" : "Photo"}
                  </div>
                )}
                <span className="absolute left-3 top-3 inline-flex rounded-md border border-white/70 bg-white/90 px-2 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
                  {item.type === "video" ? "Video" : "Photo"}
                </span>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-8 text-center text-sm text-zinc-500">
          No media in this preview filter.
        </div>
      )}
    </section>
  );
}
