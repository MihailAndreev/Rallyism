import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { albums, mediaItems, rallyEvents } from "@/db/schema";

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
  state: RallyEventState;
} & RallyEventSummaryCounts;

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

export function getRallyEventSummaryCounts(
  counts: Partial<RallyEventSummaryCounts> | undefined,
): RallyEventSummaryCounts {
  return {
    albumsCount: counts?.albumsCount ?? 0,
    mediaCount: counts?.mediaCount ?? 0,
    photosCount: counts?.photosCount ?? 0,
    videosCount: counts?.videosCount ?? 0,
  };
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

export async function getDashboardRallyEvents() {
  const [eventRows, albumCounts, mediaCounts] = await Promise.all([
    db.select().from(rallyEvents),
    getAlbumCountsByEvent(),
    getMediaCountsByEvent(),
  ]);

  const summaries: RallyEventSummary[] = eventRows.map((event) => {
    const counts = getRallyEventSummaryCounts({
      albumsCount: albumCounts.get(event.id),
      ...mediaCounts.get(event.id),
    });

    return {
      ...event,
      ...counts,
      state: getRallyEventState({
        startDate: event.startDate,
        endDate: event.endDate,
      }),
    };
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

export async function getRallyEventById(id: number) {
  const [event] = await db
    .select()
    .from(rallyEvents)
    .where(eq(rallyEvents.id, id))
    .limit(1);

  if (!event) {
    return null;
  }

  const [albumCounts, mediaCounts] = await Promise.all([
    getAlbumCountsByEvent(),
    getMediaCountsByEvent(),
  ]);

  const counts = getRallyEventSummaryCounts({
    albumsCount: albumCounts.get(event.id),
    ...mediaCounts.get(event.id),
  });

  return {
    ...event,
    ...counts,
    state: getRallyEventState({
      startDate: event.startDate,
      endDate: event.endDate,
    }),
  } satisfies RallyEventSummary;
}
