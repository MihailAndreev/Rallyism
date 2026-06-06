import Link from "next/link";

import { formatDate } from "@/components/rally-events/rally-event-format";
import { RallyEventStats } from "@/components/rally-events/rally-event-stats";
import type { RallyEventAlbum } from "@/services/rally-events";

export function AlbumCard({ album }: { album: RallyEventAlbum }) {
  return (
    <Link
      href={`/rally-events/${album.rallyEventId}/albums/${album.id}`}
      className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      {album.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={album.coverImageUrl}
          alt={`${album.title} cover`}
          className="h-40 w-full object-cover"
        />
      ) : null}
      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold tracking-normal text-zinc-950 group-hover:text-red-700">
            {album.title}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {formatDate(album.albumDate)}
          </p>
        </div>
        {album.description ? (
          <p className="text-sm leading-6 text-zinc-600">{album.description}</p>
        ) : null}
        <RallyEventStats
          albumsCount={0}
          mediaCount={album.mediaCount}
          photosCount={album.photosCount}
          videosCount={album.videosCount}
          showAlbums={false}
        />
        <span className="inline-flex text-sm font-semibold text-red-700">
          View album
        </span>
      </div>
    </Link>
  );
}
