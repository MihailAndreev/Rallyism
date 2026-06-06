import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { albums, mediaItems, rallyEvents, users } from "@/db/schema";
import type { AuthUser } from "@/services/users";

export type RallyEventState = "upcoming" | "current" | "past";

export type RallyEventSummaryCounts = {
  albumsCount: number;
  mediaCount: number;
  photosCount: number;
  videosCount: number;
};

export type RallyEventSummary = {
  id: number;
  title: string;
  rallyName: string;
  championship: "WRC" | "ERC" | "national" | "other";
  seasonYear: number;
  country: string;
  region: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  coverImageUrl: string | null;
  visibility: "private" | "public" | "unlisted";
  featured: boolean;
  createdById: number | null;
  createdAt: Date;
  updatedAt: Date;
  creatorName: string | null;
  state: RallyEventState;
} & RallyEventSummaryCounts;

export type RallyEventAlbum = {
  id: number;
  rallyEventId: number;
  title: string;
  description: string | null;
  albumDate: string | null;
  coverImageUrl: string | null;
  sortOrder: number;
  createdAt: Date;
} & RallyEventSummaryCounts;

export type RallyEventMediaPreviewItem = {
  id: number;
  albumId: number;
  type: "photo" | "video";
  title: string | null;
  caption: string | null;
  thumbnailImageUrl: string | null;
  displayImageUrl: string | null;
  originalImageUrl: string | null;
  youtubeThumbnailUrl: string | null;
  youtubeUrl: string | null;
};

export type RallyEventDetailsResult =
  | { status: "not-found" }
  | { status: "access-denied" }
  | {
      status: "allowed";
      event: RallyEventSummary;
      albums: RallyEventAlbum[];
      mediaPreview: RallyEventMediaPreviewItem[];
    };

function toDateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDateOnly(value: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getSortTime(value: string | null) {
  return parseDateOnly(value)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

function normalizeCounts(
  counts: Partial<RallyEventSummaryCounts> | undefined,
): RallyEventSummaryCounts {
  return {
    albumsCount: counts?.albumsCount ?? 0,
    mediaCount: counts?.mediaCount ?? 0,
    photosCount: counts?.photosCount ?? 0,
    videosCount: counts?.videosCount ?? 0,
  };
}

function userCanAccessEvent(
  event: { visibility: RallyEventSummary["visibility"]; createdById: number | null },
  currentUser: AuthUser,
) {
  if (event.visibility === "public" || event.visibility === "unlisted") {
    return true;
  }

  return currentUser.role === "admin" || event.createdById === currentUser.id;
}

function toRallyEventSummary(
  event: typeof rallyEvents.$inferSelect,
  counts: RallyEventSummaryCounts,
  creatorName: string | null,
): RallyEventSummary {
  return {
    ...event,
    ...counts,
    creatorName,
    state: getRallyEventState({
      startDate: event.startDate,
      endDate: event.endDate,
    }),
  };
}

export function getRallyEventState(input: {
  startDate: string | null;
  endDate: string | null;
  today?: Date;
}): RallyEventState {
  const startDate = parseDateOnly(input.startDate);

  if (!startDate) {
    return "past";
  }

  const endDate = parseDateOnly(input.endDate) ?? startDate;
  const today = toDateOnly(input.today ?? new Date());

  if (startDate > today) {
    return "upcoming";
  }

  if (endDate < today) {
    return "past";
  }

  return "current";
}

export async function getRallyEventSummaryCounts(
  rallyEventId: number,
): Promise<RallyEventSummaryCounts> {
  const [albumCountRow, mediaCountRow] = await Promise.all([
    db
      .select({
        albumsCount: sql<number>`count(${albums.id})::int`,
      })
      .from(albums)
      .where(eq(albums.rallyEventId, rallyEventId)),
    db
      .select({
        mediaCount: sql<number>`count(${mediaItems.id})::int`,
        photosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'photo'))::int`,
        videosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'video'))::int`,
      })
      .from(mediaItems)
      .where(eq(mediaItems.rallyEventId, rallyEventId)),
  ]);

  return normalizeCounts({
    albumsCount: albumCountRow[0]?.albumsCount,
    mediaCount: mediaCountRow[0]?.mediaCount,
    photosCount: mediaCountRow[0]?.photosCount,
    videosCount: mediaCountRow[0]?.videosCount,
  });
}

async function getAlbumCountsByEvent() {
  const rows = await db
    .select({
      rallyEventId: albums.rallyEventId,
      albumsCount: sql<number>`count(${albums.id})::int`,
    })
    .from(albums)
    .groupBy(albums.rallyEventId);

  return new Map(rows.map((row) => [row.rallyEventId, row.albumsCount]));
}

async function getMediaCountsByEvent() {
  const rows = await db
    .select({
      rallyEventId: mediaItems.rallyEventId,
      mediaCount: sql<number>`count(${mediaItems.id})::int`,
      photosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'photo'))::int`,
      videosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'video'))::int`,
    })
    .from(mediaItems)
    .groupBy(mediaItems.rallyEventId);

  return new Map(
    rows.map((row) => [
      row.rallyEventId,
      {
        mediaCount: row.mediaCount,
        photosCount: row.photosCount,
        videosCount: row.videosCount,
      },
    ]),
  );
}

async function getAlbumCountsByAlbum(rallyEventId: number) {
  const rows = await db
    .select({
      albumId: mediaItems.albumId,
      mediaCount: sql<number>`count(${mediaItems.id})::int`,
      photosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'photo'))::int`,
      videosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'video'))::int`,
    })
    .from(mediaItems)
    .where(eq(mediaItems.rallyEventId, rallyEventId))
    .groupBy(mediaItems.albumId);

  return new Map(
    rows.map((row) => [
      row.albumId,
      normalizeCounts({
        mediaCount: row.mediaCount,
        photosCount: row.photosCount,
        videosCount: row.videosCount,
      }),
    ]),
  );
}

export async function getDashboardRallyEvents() {
  const [eventRows, albumCounts, mediaCounts] = await Promise.all([
    db.select().from(rallyEvents),
    getAlbumCountsByEvent(),
    getMediaCountsByEvent(),
  ]);

  const summaries: RallyEventSummary[] = eventRows.map((event) => {
    const counts = normalizeCounts({
      albumsCount: albumCounts.get(event.id),
      ...mediaCounts.get(event.id),
    });

    return toRallyEventSummary(event, counts, null);
  });

  return {
    activeEvents: summaries
      .filter((event) => event.state !== "past")
      .sort((a, b) => getSortTime(a.startDate) - getSortTime(b.startDate)),
    pastEvents: summaries
      .filter((event) => event.state === "past")
      .sort((a, b) => getSortTime(b.startDate) - getSortTime(a.startDate)),
  };
}

export async function getRallyEventAccess(
  id: number,
  currentUser: AuthUser,
) {
  const [event] = await db
    .select()
    .from(rallyEvents)
    .where(eq(rallyEvents.id, id))
    .limit(1);

  if (!event) {
    return { status: "not-found" as const };
  }

  if (!userCanAccessEvent(event, currentUser)) {
    return { status: "access-denied" as const };
  }

  return { status: "allowed" as const, event };
}

export async function getRallyEventAlbums(
  rallyEventId: number,
): Promise<RallyEventAlbum[]> {
  const [albumRows, countsByAlbum] = await Promise.all([
    db
      .select()
      .from(albums)
      .where(eq(albums.rallyEventId, rallyEventId))
      .orderBy(asc(albums.sortOrder), asc(albums.albumDate), asc(albums.createdAt)),
    getAlbumCountsByAlbum(rallyEventId),
  ]);

  return albumRows.map((album) => ({
    id: album.id,
    rallyEventId: album.rallyEventId,
    title: album.title,
    description: album.description,
    albumDate: album.albumDate,
    coverImageUrl: album.coverImageUrl,
    sortOrder: album.sortOrder,
    createdAt: album.createdAt,
    ...normalizeCounts({
      albumsCount: 0,
      ...countsByAlbum.get(album.id),
    }),
  }));
}

export async function getRallyEventMediaPreview(
  rallyEventId: number,
  limit = 6,
): Promise<RallyEventMediaPreviewItem[]> {
  return db
    .select({
      id: mediaItems.id,
      albumId: mediaItems.albumId,
      type: mediaItems.type,
      title: mediaItems.title,
      caption: mediaItems.caption,
      thumbnailImageUrl: mediaItems.thumbnailImageUrl,
      displayImageUrl: mediaItems.displayImageUrl,
      originalImageUrl: mediaItems.originalImageUrl,
      youtubeThumbnailUrl: mediaItems.youtubeThumbnailUrl,
      youtubeUrl: mediaItems.youtubeUrl,
    })
    .from(mediaItems)
    .innerJoin(albums, eq(mediaItems.albumId, albums.id))
    .where(sql`${mediaItems.rallyEventId} = ${rallyEventId} and (${mediaItems.type} = 'video' or ${mediaItems.thumbnailImageUrl} is not null or ${mediaItems.displayImageUrl} is not null or ${mediaItems.originalImageUrl} is not null)`)
    .orderBy(asc(albums.sortOrder), asc(albums.albumDate), asc(mediaItems.sortOrder))
    .limit(limit);
}

export async function getRallyEventDetails(
  id: number,
  currentUser: AuthUser,
): Promise<RallyEventDetailsResult> {
  const [row] = await db
    .select({
      event: rallyEvents,
      creatorName: users.name,
    })
    .from(rallyEvents)
    .leftJoin(users, eq(rallyEvents.createdById, users.id))
    .where(eq(rallyEvents.id, id))
    .limit(1);

  if (!row) {
    return { status: "not-found" };
  }

  if (!userCanAccessEvent(row.event, currentUser)) {
    return { status: "access-denied" };
  }

  const [counts, eventAlbums, mediaPreview] = await Promise.all([
    getRallyEventSummaryCounts(id),
    getRallyEventAlbums(id),
    getRallyEventMediaPreview(id, 6),
  ]);

  return {
    status: "allowed",
    event: toRallyEventSummary(row.event, counts, row.creatorName),
    albums: eventAlbums,
    mediaPreview,
  };
}

export async function getRallyEventById(id: number) {
  const [event] = await db
    .select()
    .from(rallyEvents)
    .where(eq(rallyEvents.id, id))
    .limit(1);

  if (!event) {
    return null;
  }

  const counts = await getRallyEventSummaryCounts(id);

  return toRallyEventSummary(event, counts, null);
}

export async function getAlbumPlaceholderDetails(input: {
  rallyEventId: number;
  albumId: number;
  currentUser: AuthUser;
}) {
  const access = await getRallyEventAccess(input.rallyEventId, input.currentUser);

  if (access.status !== "allowed") {
    return access;
  }

  const [album] = await db
    .select()
    .from(albums)
    .where(
      and(
        eq(albums.id, input.albumId),
        eq(albums.rallyEventId, input.rallyEventId),
      ),
    )
    .limit(1);

  if (!album) {
    return { status: "not-found" as const };
  }

  return {
    status: "allowed" as const,
    event: access.event,
    album,
  };
}
