"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

export type AlbumMediaGridItem = {
  id: number;
  albumId: number;
  type: "photo" | "video";
  title: string | null;
  thumbnailImageUrl: string | null;
  displayImageUrl: string | null;
  originalImageUrl: string | null;
  youtubeThumbnailUrl: string | null;
  youtubeUrl: string | null;
  canManage: boolean;
  viewerHref: string;
  editHref: string;
};

type AlbumMediaGridProps = {
  action: (formData: FormData) => void | Promise<void>;
  albumId: number;
  items: AlbumMediaGridItem[];
  rallyEventId: number;
};

function getPhotoImageUrl(item: AlbumMediaGridItem) {
  return item.thumbnailImageUrl ?? item.displayImageUrl ?? item.originalImageUrl;
}

function getTitle(item: AlbumMediaGridItem) {
  return item.title ?? (item.type === "video" ? "YouTube video" : "Photo");
}

function DeleteButton({ selectedCount }: { selectedCount: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || selectedCount === 0}
      className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {pending ? "Deleting..." : "Delete selected"}
    </button>
  );
}

export function AlbumMediaGrid({
  action,
  albumId,
  items,
  rallyEventId,
}: AlbumMediaGridProps) {
  const [manageMode, setManageMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const manageablePhotoIds = useMemo(
    () =>
      items
        .filter((item) => item.type === "photo" && item.canManage)
        .map((item) => item.id),
    [items],
  );
  const selectedCount = selectedPhotoIds.length;

  function togglePhoto(photoId: number) {
    setSelectedPhotoIds((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId],
    );
  }

  function toggleManageMode() {
    setManageMode((current) => !current);
    setSelectedPhotoIds([]);
  }

  return (
    <div className="space-y-4">
      {manageablePhotoIds.length > 0 ? (
        <form
          action={action}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-3"
          onSubmit={(event) => {
            if (selectedCount === 0) {
              event.preventDefault();
              return;
            }

            if (
              !window.confirm(
                `Delete ${selectedCount} selected photo${
                  selectedCount === 1 ? "" : "s"
                }? This cannot be undone.`,
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="rallyEventId" value={rallyEventId} />
          <input type="hidden" name="albumId" value={albumId} />
          {selectedPhotoIds.map((photoId) => (
            <input key={photoId} type="hidden" name="photoIds" value={photoId} />
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition ${
                manageMode
                  ? "bg-zinc-950 text-white hover:bg-zinc-800"
                  : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"
              }`}
              onClick={toggleManageMode}
            >
              {manageMode ? "Done" : "Manage photos"}
            </button>
            {manageMode ? (
              <span className="text-sm font-medium text-zinc-600">
                {selectedCount} selected
              </span>
            ) : null}
          </div>

          {manageMode ? <DeleteButton selectedCount={selectedCount} /> : null}
        </form>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) =>
          item.type === "photo" ? (
            <PhotoTile
              key={item.id}
              item={item}
              manageMode={manageMode}
              selected={selectedPhotoIds.includes(item.id)}
              onToggle={() => togglePhoto(item.id)}
            />
          ) : (
            <VideoTile key={item.id} item={item} />
          ),
        )}
      </div>
    </div>
  );
}

function PhotoTile({
  item,
  manageMode,
  selected,
  onToggle,
}: {
  item: AlbumMediaGridItem;
  manageMode: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const imageUrl = getPhotoImageUrl(item);
  const interactiveClass =
    "group relative block aspect-square overflow-hidden rounded-md border bg-zinc-100 shadow-sm transition hover:border-red-200 hover:shadow-md";
  const borderClass = selected ? "border-red-500 ring-2 ring-red-500" : "border-zinc-200";

  const image = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={getTitle(item)}
      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.025]"
    />
  ) : (
    <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-zinc-500">
      Photo
    </div>
  );

  if (manageMode && item.canManage) {
    return (
      <div className={`${interactiveClass} ${borderClass}`}>
        <button
          type="button"
          aria-pressed={selected}
          className="absolute inset-0 z-10"
          onClick={onToggle}
        >
          <span className="sr-only">
            {selected ? "Unselect photo" : "Select photo"}
          </span>
        </button>
        {image}
        <span
          className={`absolute left-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
            selected
              ? "border-red-600 bg-red-600 text-white"
              : "border-white/80 bg-black/45 text-white"
          }`}
        >
          {selected ? "x" : ""}
        </span>
        <EditLink href={item.editHref} />
      </div>
    );
  }

  return (
    <article className={`${interactiveClass} ${borderClass}`}>
      <Link href={item.viewerHref} scroll={false} className="block h-full">
        {image}
        <span className="sr-only">Open photo viewer</span>
      </Link>
      {item.canManage ? <EditLink href={item.editHref} /> : null}
    </article>
  );
}

function VideoTile({ item }: { item: AlbumMediaGridItem }) {
  const thumbnailUrl = item.youtubeThumbnailUrl;
  const content = (
    <>
      <div className="aspect-square w-full bg-zinc-100">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={getTitle(item)}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-zinc-500">
            YouTube
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-8">
        <p className="truncate text-xs font-semibold text-white">
          {getTitle(item)}
        </p>
      </div>
      <span className="pointer-events-none absolute left-2 top-2 inline-flex h-7 items-center justify-center rounded-full bg-black/55 px-2 text-[10px] font-bold uppercase text-white">
        Play
      </span>
    </>
  );

  return (
    <article className="group relative aspect-square overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm transition hover:border-red-200 hover:shadow-md">
      {item.youtubeUrl ? (
        <a
          href={item.youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="block h-full"
        >
          {content}
          <span className="sr-only">Open video on YouTube</span>
        </a>
      ) : (
        content
      )}
      {item.canManage ? <EditLink href={item.editHref} /> : null}
    </article>
  );
}

function EditLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="absolute right-2 top-2 z-30 inline-flex h-7 items-center justify-center rounded-full bg-white/90 px-2 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-white"
      onClick={(event) => event.stopPropagation()}
    >
      Edit
    </Link>
  );
}
