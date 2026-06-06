import type { RallyEventSummaryCounts } from "@/services/rally-events";

export function RallyEventStats({
  albumsCount,
  mediaCount,
  photosCount,
  videosCount,
  showAlbums = true,
}: RallyEventSummaryCounts & { showAlbums?: boolean }) {
  const stats = [
    ...(showAlbums ? [{ label: "Albums", value: albumsCount }] : []),
    { label: "Media", value: mediaCount },
    { label: "Photos", value: photosCount },
    { label: "Videos", value: videosCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2"
        >
          <p className="text-lg font-semibold text-zinc-950">{stat.value}</p>
          <p className="text-xs text-zinc-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
