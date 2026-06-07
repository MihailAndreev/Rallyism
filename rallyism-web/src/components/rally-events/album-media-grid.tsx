"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  albumId: number;
  bulkDeletePhotosAction: (formData: FormData) => void | Promise<void>;
  bulkDeleteVideosAction: (formData: FormData) => void | Promise<void>;
  items: AlbumMediaGridItem[];
  rallyEventId: number;
};

type ManagementMode =
  | "none"
  | "selectPhotos"
  | "editPhotos"
  | "selectVideos"
  | "editVideos";

function getPhotoImageUrl(item: AlbumMediaGridItem) {
  return item.thumbnailImageUrl ?? item.displayImageUrl ?? item.originalImageUrl;
}

function getTitle(item: AlbumMediaGridItem) {
  return item.title ?? (item.type === "video" ? "YouTube video" : "Photo");
}

function DeleteButton({
  onClick,
  selectedCount,
  submitting,
}: {
  onClick: () => void;
  selectedCount: number;
  submitting: boolean;
}) {
  return (
    <button
      type="button"
      disabled={submitting || selectedCount === 0}
      className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
      onClick={onClick}
    >
      {submitting ? "Deleting..." : "Delete selected"}
    </button>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition ${
        active
          ? "bg-zinc-950 text-white hover:bg-zinc-800"
          : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function AlbumMediaGrid({
  albumId,
  bulkDeletePhotosAction,
  bulkDeleteVideosAction,
  items,
  rallyEventId,
}: AlbumMediaGridProps) {
  const photoFormRef = useRef<HTMLFormElement>(null);
  const videoFormRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<ManagementMode>("none");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([]);
  const manageablePhotoIds = useMemo(
    () =>
      items
        .filter((item) => item.type === "photo" && item.canManage)
        .map((item) => item.id),
    [items],
  );
  const manageableVideoIds = useMemo(
    () =>
      items
        .filter((item) => item.type === "video" && item.canManage)
        .map((item) => item.id),
    [items],
  );
  const selectedCount = selectedPhotoIds.length;
  const selectedVideoCount = selectedVideoIds.length;
  const activeSelectedCount =
    mode === "selectVideos" ? selectedVideoCount : selectedCount;
  const deletingVideos = mode === "selectVideos";
  const hasManagementControls =
    manageablePhotoIds.length > 0 || manageableVideoIds.length > 0;

  function togglePhoto(photoId: number) {
    setSelectedPhotoIds((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId],
    );
  }

  function toggleVideo(videoId: number) {
    setSelectedVideoIds((current) =>
      current.includes(videoId)
        ? current.filter((id) => id !== videoId)
        : [...current, videoId],
    );
  }

  function setManagementMode(nextMode: ManagementMode) {
    setMode((current) => (current === nextMode ? "none" : nextMode));
    setSelectedPhotoIds([]);
    setSelectedVideoIds([]);
    setShowDeleteDialog(false);
  }

  function submitBulkDelete() {
    if (activeSelectedCount === 0 || submitting) {
      return;
    }

    setSubmitting(true);
    if (deletingVideos) {
      videoFormRef.current?.requestSubmit();
      return;
    }

    photoFormRef.current?.requestSubmit();
  }

  return (
    <div className="space-y-4">
      {hasManagementControls ? (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {manageablePhotoIds.length > 0 ? (
                <>
                  <ModeButton
                    active={mode === "selectPhotos"}
                    onClick={() => setManagementMode("selectPhotos")}
                  >
                    Select photos
                  </ModeButton>
                  <ModeButton
                    active={mode === "editPhotos"}
                    onClick={() => setManagementMode("editPhotos")}
                  >
                    Edit photos
                  </ModeButton>
                </>
              ) : null}
              {manageableVideoIds.length > 0 ? (
                <>
                  <ModeButton
                    active={mode === "selectVideos"}
                    onClick={() => setManagementMode("selectVideos")}
                  >
                    Select videos
                  </ModeButton>
                  <ModeButton
                    active={mode === "editVideos"}
                    onClick={() => setManagementMode("editVideos")}
                  >
                    Edit videos
                  </ModeButton>
                </>
              ) : null}
            </div>

            {mode === "selectPhotos" || mode === "selectVideos" ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-zinc-600">
                  {activeSelectedCount} selected
                </span>
                <DeleteButton
                  selectedCount={activeSelectedCount}
                  submitting={submitting}
                  onClick={() => setShowDeleteDialog(true)}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {manageablePhotoIds.length > 0 ? (
        <form
          ref={photoFormRef}
          action={bulkDeletePhotosAction}
          className="hidden"
          onSubmit={(event) => {
            if (selectedCount === 0) {
              event.preventDefault();
              return;
            }

            setSubmitting(true);
          }}
        >
          <input type="hidden" name="rallyEventId" value={rallyEventId} />
          <input type="hidden" name="albumId" value={albumId} />
          {selectedPhotoIds.map((photoId) => (
            <input key={photoId} type="hidden" name="photoIds" value={photoId} />
          ))}
        </form>
      ) : null}

      {manageableVideoIds.length > 0 ? (
        <form
          ref={videoFormRef}
          action={bulkDeleteVideosAction}
          className="hidden"
          onSubmit={(event) => {
            if (selectedVideoCount === 0) {
              event.preventDefault();
              return;
            }

            setSubmitting(true);
          }}
        >
          <input type="hidden" name="rallyEventId" value={rallyEventId} />
          <input type="hidden" name="albumId" value={albumId} />
          {selectedVideoIds.map((videoId) => (
            <input key={videoId} type="hidden" name="videoIds" value={videoId} />
          ))}
        </form>
      ) : null}

      <ConfirmDialog
        open={showDeleteDialog}
        title={`Delete selected ${deletingVideos ? "videos" : "photos"}?`}
        description={`Delete ${activeSelectedCount} selected ${
          deletingVideos ? "video" : "photo"
        }${
          activeSelectedCount === 1 ? "" : "s"
        } from this album. This cannot be undone.`}
        confirmLabel={deletingVideos ? "Delete videos" : "Delete photos"}
        pendingLabel="Deleting..."
        destructive
        pending={submitting}
        onCancel={() => {
          if (!submitting) {
            setShowDeleteDialog(false);
          }
        }}
        onConfirm={submitBulkDelete}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) =>
          item.type === "photo" ? (
            <PhotoTile
              key={item.id}
              item={item}
              mode={mode}
              selected={selectedPhotoIds.includes(item.id)}
              onToggle={() => togglePhoto(item.id)}
            />
          ) : (
            <VideoTile
              key={item.id}
              item={item}
              mode={mode}
              selected={selectedVideoIds.includes(item.id)}
              onToggle={() => toggleVideo(item.id)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function PhotoTile({
  item,
  mode,
  selected,
  onToggle,
}: {
  item: AlbumMediaGridItem;
  mode: ManagementMode;
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

  if (mode === "selectPhotos" && item.canManage) {
    return (
      <article className={`${interactiveClass} ${borderClass}`}>
        <button
          type="button"
          aria-pressed={selected}
          className="block h-full w-full cursor-pointer text-left"
          onClick={onToggle}
        >
          <span className="sr-only">
            {selected ? "Unselect photo" : "Select photo"}
          </span>
          {image}
          <span
            className={`pointer-events-none absolute inset-0 transition ${
              selected ? "bg-red-600/20" : "bg-black/0 group-hover:bg-black/10"
            }`}
          />
          <span
            className={`pointer-events-none absolute left-2 top-2 z-20 inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[10px] font-bold uppercase shadow-sm ${
              selected
                ? "border-red-600 bg-red-600 text-white"
                : "border-white/80 bg-black/55 text-white"
            }`}
          >
            {selected ? "Selected" : "Select"}
          </span>
        </button>
      </article>
    );
  }

  return (
    <article className={`${interactiveClass} ${borderClass}`}>
      <Link href={item.viewerHref} scroll={false} className="block h-full">
        {image}
        <span className="sr-only">Open photo viewer</span>
      </Link>
      {mode === "editPhotos" && item.canManage ? (
        <EditLink href={item.editHref} />
      ) : null}
    </article>
  );
}

function VideoTile({
  item,
  mode,
  selected,
  onToggle,
}: {
  item: AlbumMediaGridItem;
  mode: ManagementMode;
  selected: boolean;
  onToggle: () => void;
}) {
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
  const borderClass = selected ? "border-red-500 ring-2 ring-red-500" : "border-zinc-200";

  if (mode === "selectVideos" && item.canManage) {
    return (
      <article
        className={`group relative aspect-square overflow-hidden rounded-md border bg-white shadow-sm transition hover:border-red-200 hover:shadow-md ${borderClass}`}
      >
        <button
          type="button"
          aria-pressed={selected}
          className="block h-full w-full cursor-pointer text-left"
          onClick={onToggle}
        >
          <span className="sr-only">
            {selected ? "Unselect video" : "Select video"}
          </span>
          {content}
          <span
            className={`pointer-events-none absolute inset-0 transition ${
              selected ? "bg-red-600/20" : "bg-black/0 group-hover:bg-black/10"
            }`}
          />
          <span
            className={`pointer-events-none absolute right-2 top-2 z-20 inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[10px] font-bold uppercase shadow-sm ${
              selected
                ? "border-red-600 bg-red-600 text-white"
                : "border-white/80 bg-black/55 text-white"
            }`}
          >
            {selected ? "Selected" : "Select"}
          </span>
        </button>
      </article>
    );
  }

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
      {mode === "editVideos" && item.canManage ? (
        <EditLink href={item.editHref} />
      ) : null}
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
