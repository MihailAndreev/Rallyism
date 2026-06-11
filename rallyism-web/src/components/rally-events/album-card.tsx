import Link from "next/link";
import Image from "next/image";

import { formatDate } from "@/components/rally-events/rally-event-format";
import type { RallyEventAlbum } from "@/services/rally-events";

function AlbumCounts({
  mediaCount,
  photosCount,
  videosCount,
}: Pick<RallyEventAlbum, "mediaCount" | "photosCount" | "videosCount">) {
  const counts = [
    { label: "media", value: mediaCount },
    { label: "photos", value: photosCount },
    { label: "videos", value: videosCount },
  ];

  return (
    <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-500">
      {counts.map((count) => (
        <span key={count.label}>
          <span className="font-semibold text-zinc-800">{count.value}</span>{" "}
          {count.label}
        </span>
      ))}
    </div>
  );
}

export function AlbumCard({ album }: { album: RallyEventAlbum }) {
  return (
    <Link
      href={`/rally-events/${album.rallyEventId}/albums/${album.id}`}
      className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-rally-blue-border hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
        {album.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.coverImageUrl}
            alt={`${album.title} cover`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="relative h-full bg-zinc-50">
            <Image
              src="/images/rallyism-logo.png"
              alt=""
              width={220}
              height={239}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[46%] max-w-72 -translate-x-1/2 -translate-y-1/2 opacity-[0.23]"
            />
          </div>
        )}
        <span className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
          {formatDate(album.albumDate)}
        </span>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold tracking-normal text-zinc-950 group-hover:text-rally-blue">
            {album.title}
          </h3>
          <span className="mt-1 shrink-0 text-sm font-semibold text-rally-blue">
            Open
          </span>
        </div>

        {album.description ? (
          <p className="line-clamp-2 text-sm leading-6 text-zinc-600">
            {album.description}
          </p>
        ) : null}

        <AlbumCounts
          mediaCount={album.mediaCount}
          photosCount={album.photosCount}
          videosCount={album.videosCount}
        />
      </div>
    </Link>
  );
}

export function EmptyAlbumCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-white shadow-sm">
      <div className="relative aspect-[16/10] bg-zinc-50">
        <Image
          src="/images/rallyism-logo.png"
          alt=""
          width={220}
          height={239}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-auto w-[46%] max-w-72 -translate-x-1/2 -translate-y-1/2 opacity-[0.202]"
        />
      </div>
      <div className="space-y-2 p-5">
        <h3 className="text-xl font-semibold tracking-normal text-zinc-950">
          Rally memories will appear here.
        </h3>
        <p className="text-sm leading-6 text-zinc-500">
          Albums and media are still empty for this event.
        </p>
      </div>
    </div>
  );
}
