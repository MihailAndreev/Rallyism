import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { albums, mediaItems, rallyEvents, users } from "@/db/schema";
import { canContribute, isAdmin } from "@/lib/auth/authorization";
import type { AuthUser } from "@/services/users";

export type RallyEventState = "upcoming" | "current" | "past";
export type RallyEventChampionship = "WRC" | "ERC" | "national" | "other";
export type RallyEventVisibility = "private" | "public" | "unlisted";

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
  championship: RallyEventChampionship;
  seasonYear: number;
  country: string;
  region: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  coverImageUrl: string | null;
  visibility: RallyEventVisibility;
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

export type AlbumFormInput = {
  title: string;
  description: string;
  albumDate: string;
  coverImageUrl: string;
  sortOrder: string;
};

export type AlbumFormValues = {
  title: string;
  description: string | null;
  albumDate: string | null;
  coverImageUrl: string | null;
  sortOrder: number;
};

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

export type AlbumMediaFilter = "all" | "photos" | "videos";

export type AlbumMediaItem = RallyEventMediaPreviewItem & {
  dateTaken: Date | null;
  location: string | null;
  sortOrder: number;
  createdAt: Date;
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

export type PublicRallyEventsPage = {
  events: RallyEventSummary[];
  currentPage: number;
  pageSize: number;
  totalEvents: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type AlbumMediaPage = {
  items: AlbumMediaItem[];
  filter: AlbumMediaFilter;
  currentPage: number;
  pageSize: number;
  totalMedia: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type AlbumMediaGalleryDetailsResult =
  | { status: "not-found" }
  | { status: "access-denied" }
  | {
      status: "allowed";
      event: RallyEventSummary;
      album: RallyEventAlbum;
      mediaPage: AlbumMediaPage;
    };

export type RallyEventFormInput = {
  title: string;
  rallyName: string;
  championship: string;
  seasonYear: string;
  country: string;
  region: string;
  startDate: string;
  endDate: string;
  description: string;
  coverImageUrl: string;
  visibility: string;
  featured?: string | boolean | null;
};

export type RallyEventFormValues = {
  title: string;
  rallyName: string;
  championship: RallyEventChampionship;
  seasonYear: number;
  country: string;
  region: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  coverImageUrl: string | null;
  visibility: RallyEventVisibility;
  featured: boolean;
};

export class RallyEventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RallyEventValidationError";
  }
}

export class AlbumValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlbumValidationError";
  }
}

export type EditableRallyEventResult =
  | { status: "not-found" }
  | { status: "access-denied" }
  | { status: "allowed"; event: RallyEventSummary };

export type EditableAlbumResult =
  | { status: "not-found" }
  | { status: "access-denied" }
  | {
      status: "allowed";
      event: RallyEventSummary;
      album: RallyEventAlbum;
    };

const validChampionships = ["WRC", "ERC", "national", "other"] as const;
const validVisibilities = ["private", "public", "unlisted"] as const;

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
  currentUser: AuthUser | null,
) {
  if (event.visibility === "public" || event.visibility === "unlisted") {
    return true;
  }

  if (!currentUser) {
    return false;
  }

  return currentUser.role === "admin" || event.createdById === currentUser.id;
}

export function userCanManageEvent(
  event: { createdById: number | null },
  currentUser: AuthUser | null,
) {
  if (!currentUser) {
    return false;
  }

  return isAdmin(currentUser) || event.createdById === currentUser.id;
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function normalizeOptionalDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!isValidDateOnly(trimmed)) {
    throw new RallyEventValidationError("Enter valid rally dates.");
  }

  return trimmed;
}

function parseChampionship(value: string): RallyEventChampionship {
  if (validChampionships.includes(value as RallyEventChampionship)) {
    return value as RallyEventChampionship;
  }

  throw new RallyEventValidationError("Choose a valid championship.");
}

function parseVisibility(value: string): RallyEventVisibility {
  if (validVisibilities.includes(value as RallyEventVisibility)) {
    return value as RallyEventVisibility;
  }

  throw new RallyEventValidationError("Choose a valid visibility.");
}

export function validateRallyEventInput(
  input: RallyEventFormInput,
  currentUser: AuthUser,
): RallyEventFormValues {
  const title = input.title.trim();
  const rallyName = input.rallyName.trim();
  const country = input.country.trim();
  const seasonYear = Number(input.seasonYear);
  const currentYear = new Date().getFullYear();
  const startDate = normalizeOptionalDate(input.startDate);
  const endDate = normalizeOptionalDate(input.endDate);

  if (!title) {
    throw new RallyEventValidationError("Title is required.");
  }

  if (!rallyName) {
    throw new RallyEventValidationError("Rally name is required.");
  }

  if (
    !Number.isInteger(seasonYear) ||
    seasonYear < 1950 ||
    seasonYear > currentYear + 2
  ) {
    throw new RallyEventValidationError(
      `Season year must be between 1950 and ${currentYear + 2}.`,
    );
  }

  if (!country) {
    throw new RallyEventValidationError("Country is required.");
  }

  if (startDate && endDate && endDate < startDate) {
    throw new RallyEventValidationError("End date cannot be before start date.");
  }

  return {
    title,
    rallyName,
    championship: parseChampionship(input.championship),
    seasonYear,
    country,
    region: normalizeNullableText(input.region),
    startDate,
    endDate,
    description: normalizeNullableText(input.description),
    coverImageUrl: normalizeNullableText(input.coverImageUrl),
    visibility: parseVisibility(input.visibility),
    featured: isAdmin(currentUser) && input.featured === "on",
  };
}

export function validateAlbumInput(input: AlbumFormInput): AlbumFormValues {
  const title = input.title.trim();
  const sortOrderText = input.sortOrder.trim();
  const sortOrder = sortOrderText ? Number(sortOrderText) : 0;

  if (!title) {
    throw new AlbumValidationError("Album title is required.");
  }

  if (!Number.isInteger(sortOrder)) {
    throw new AlbumValidationError("Sort order must be a whole number.");
  }

  return {
    title,
    description: normalizeNullableText(input.description),
    albumDate: normalizeOptionalDate(input.albumDate),
    coverImageUrl: normalizeNullableText(input.coverImageUrl),
    sortOrder,
  };
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

async function getAlbumCountsByEvent(rallyEventIds?: number[]) {
  if (rallyEventIds && rallyEventIds.length === 0) {
    return new Map<number, number>();
  }

  const query = db
    .select({
      rallyEventId: albums.rallyEventId,
      albumsCount: sql<number>`count(${albums.id})::int`,
    })
    .from(albums)
    .$dynamic();

  if (rallyEventIds) {
    query.where(inArray(albums.rallyEventId, rallyEventIds));
  }

  const rows = await query.groupBy(albums.rallyEventId);

  return new Map(rows.map((row) => [row.rallyEventId, row.albumsCount]));
}

async function getMediaCountsByEvent(rallyEventIds?: number[]) {
  if (rallyEventIds && rallyEventIds.length === 0) {
    return new Map<number, Omit<RallyEventSummaryCounts, "albumsCount">>();
  }

  const query = db
    .select({
      rallyEventId: mediaItems.rallyEventId,
      mediaCount: sql<number>`count(${mediaItems.id})::int`,
      photosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'photo'))::int`,
      videosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'video'))::int`,
    })
    .from(mediaItems)
    .$dynamic();

  if (rallyEventIds) {
    query.where(inArray(mediaItems.rallyEventId, rallyEventIds));
  }

  const rows = await query.groupBy(mediaItems.rallyEventId);

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

async function getSingleAlbumMediaCounts(albumId: number) {
  const [row] = await db
    .select({
      mediaCount: sql<number>`count(${mediaItems.id})::int`,
      photosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'photo'))::int`,
      videosCount: sql<number>`(count(${mediaItems.id}) filter (where ${mediaItems.type} = 'video'))::int`,
    })
    .from(mediaItems)
    .where(eq(mediaItems.albumId, albumId));

  return normalizeCounts({
    albumsCount: 0,
    mediaCount: row?.mediaCount,
    photosCount: row?.photosCount,
    videosCount: row?.videosCount,
  });
}

function getMediaTypeForFilter(filter: AlbumMediaFilter) {
  if (filter === "photos") {
    return "photo";
  }

  if (filter === "videos") {
    return "video";
  }

  return null;
}

async function getAlbumMediaPage(input: {
  rallyEventId: number;
  albumId: number;
  filter?: AlbumMediaFilter;
  page?: number;
  pageSize?: number;
}): Promise<AlbumMediaPage> {
  const filter = input.filter ?? "all";
  const pageSize = input.pageSize ?? 12;
  const requestedPage =
    input.page && Number.isInteger(input.page) && input.page > 0 ? input.page : 1;
  const mediaType = getMediaTypeForFilter(filter);
  const whereClause = mediaType
    ? and(
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.type, mediaType),
      )
    : and(
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.albumId, input.albumId),
      );

  const [{ totalMedia }] = await db
    .select({
      totalMedia: sql<number>`count(${mediaItems.id})::int`,
    })
    .from(mediaItems)
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil((totalMedia ?? 0) / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const items = await db
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
      dateTaken: mediaItems.dateTaken,
      location: mediaItems.location,
      sortOrder: mediaItems.sortOrder,
      createdAt: mediaItems.createdAt,
    })
    .from(mediaItems)
    .where(whereClause)
    .orderBy(asc(mediaItems.sortOrder), asc(mediaItems.dateTaken), asc(mediaItems.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    filter,
    currentPage,
    pageSize,
    totalMedia: totalMedia ?? 0,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
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

export async function getPublicRallyEventsPage(input: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PublicRallyEventsPage> {
  const pageSize = input.pageSize ?? 9;
  const requestedPage =
    input.page && Number.isInteger(input.page) && input.page > 0 ? input.page : 1;

  const [{ totalEvents }] = await db
    .select({
      totalEvents: sql<number>`count(${rallyEvents.id})::int`,
    })
    .from(rallyEvents)
    .where(eq(rallyEvents.visibility, "public"));

  const totalPages = Math.max(1, Math.ceil((totalEvents ?? 0) / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const eventRows = await db
    .select({
      event: rallyEvents,
      creatorName: users.name,
    })
    .from(rallyEvents)
    .leftJoin(users, eq(rallyEvents.createdById, users.id))
    .where(eq(rallyEvents.visibility, "public"))
    .orderBy(
      desc(rallyEvents.featured),
      desc(rallyEvents.startDate),
      desc(rallyEvents.createdAt),
    )
    .limit(pageSize)
    .offset(offset);

  const eventIds = eventRows.map((row) => row.event.id);
  const [albumCounts, mediaCounts] = await Promise.all([
    getAlbumCountsByEvent(eventIds),
    getMediaCountsByEvent(eventIds),
  ]);

  const events = eventRows.map((row) => {
    const counts = normalizeCounts({
      albumsCount: albumCounts.get(row.event.id),
      ...mediaCounts.get(row.event.id),
    });

    return toRallyEventSummary(row.event, counts, row.creatorName);
  });

  return {
    events,
    currentPage,
    pageSize,
    totalEvents: totalEvents ?? 0,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

export async function getRallyEventAccess(
  id: number,
  currentUser: AuthUser | null,
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

  return albumRows.map((album) =>
    toRallyEventAlbum(
      album,
      normalizeCounts({
        albumsCount: 0,
        ...countsByAlbum.get(album.id),
      }),
    ),
  );
}

function toRallyEventAlbum(
  album: typeof albums.$inferSelect,
  counts: RallyEventSummaryCounts,
): RallyEventAlbum {
  return {
    id: album.id,
    rallyEventId: album.rallyEventId,
    title: album.title,
    description: album.description,
    albumDate: album.albumDate,
    coverImageUrl: album.coverImageUrl,
    sortOrder: album.sortOrder,
    createdAt: album.createdAt,
    ...counts,
  };
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
  currentUser: AuthUser | null,
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

export async function createRallyEvent(input: {
  currentUser: AuthUser;
  values: RallyEventFormValues;
}) {
  if (!canContribute(input.currentUser)) {
    throw new RallyEventValidationError("Your account is not approved to create rally events.");
  }

  const [event] = await db
    .insert(rallyEvents)
    .values({
      ...input.values,
      createdById: input.currentUser.id,
      updatedAt: new Date(),
    })
    .returning();

  return event;
}

export async function getEditableRallyEvent(
  id: number,
  currentUser: AuthUser | null,
): Promise<EditableRallyEventResult> {
  const [event] = await db
    .select()
    .from(rallyEvents)
    .where(eq(rallyEvents.id, id))
    .limit(1);

  if (!event) {
    return { status: "not-found" };
  }

  if (!userCanManageEvent(event, currentUser)) {
    return { status: "access-denied" };
  }

  const counts = await getRallyEventSummaryCounts(id);

  return {
    status: "allowed",
    event: toRallyEventSummary(event, counts, null),
  };
}

export async function updateRallyEvent(input: {
  id: number;
  currentUser: AuthUser;
  values: RallyEventFormValues;
}) {
  const access = await getEditableRallyEvent(input.id, input.currentUser);

  if (access.status === "not-found") {
    return { status: "not-found" as const };
  }

  if (access.status === "access-denied") {
    return { status: "access-denied" as const };
  }

  const [event] = await db
    .update(rallyEvents)
    .set({
      ...input.values,
      featured: isAdmin(input.currentUser)
        ? input.values.featured
        : access.event.featured,
      updatedAt: new Date(),
    })
    .where(eq(rallyEvents.id, input.id))
    .returning();

  return { status: "allowed" as const, event };
}

export async function createAlbum(input: {
  rallyEventId: number;
  currentUser: AuthUser;
  values: AlbumFormValues;
}) {
  if (!canContribute(input.currentUser)) {
    throw new AlbumValidationError("Your account is not approved to create albums.");
  }

  const eventAccess = await getEditableRallyEvent(
    input.rallyEventId,
    input.currentUser,
  );

  if (eventAccess.status !== "allowed") {
    return eventAccess;
  }

  const [album] = await db
    .insert(albums)
    .values({
      ...input.values,
      rallyEventId: input.rallyEventId,
      createdById: input.currentUser.id,
      updatedAt: new Date(),
    })
    .returning();

  return { status: "allowed" as const, album };
}

export async function getEditableAlbum(input: {
  rallyEventId: number;
  albumId: number;
  currentUser: AuthUser | null;
}): Promise<EditableAlbumResult> {
  const eventAccess = await getEditableRallyEvent(
    input.rallyEventId,
    input.currentUser,
  );

  if (eventAccess.status !== "allowed") {
    return eventAccess;
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
    return { status: "not-found" };
  }

  const albumCounts = await getSingleAlbumMediaCounts(input.albumId);

  return {
    status: "allowed",
    event: eventAccess.event,
    album: toRallyEventAlbum(album, albumCounts),
  };
}

export async function updateAlbum(input: {
  rallyEventId: number;
  albumId: number;
  currentUser: AuthUser;
  values: AlbumFormValues;
}) {
  if (!canContribute(input.currentUser)) {
    throw new AlbumValidationError("Your account is not approved to edit albums.");
  }

  const access = await getEditableAlbum({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    currentUser: input.currentUser,
  });

  if (access.status !== "allowed") {
    return access;
  }

  const [album] = await db
    .update(albums)
    .set({
      ...input.values,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(albums.id, input.albumId),
        eq(albums.rallyEventId, input.rallyEventId),
      ),
    )
    .returning();

  return { status: "allowed" as const, album };
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
  currentUser: AuthUser | null;
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

export async function getAlbumMediaGalleryDetails(input: {
  rallyEventId: number;
  albumId: number;
  currentUser: AuthUser | null;
  filter?: AlbumMediaFilter;
  page?: number;
  pageSize?: number;
}): Promise<AlbumMediaGalleryDetailsResult> {
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
    return { status: "not-found" };
  }

  const [eventCounts, albumCounts, mediaPage] = await Promise.all([
    getRallyEventSummaryCounts(input.rallyEventId),
    getSingleAlbumMediaCounts(input.albumId),
    getAlbumMediaPage({
      rallyEventId: input.rallyEventId,
      albumId: input.albumId,
      filter: input.filter,
      page: input.page,
      pageSize: input.pageSize,
    }),
  ]);

  return {
    status: "allowed",
    event: toRallyEventSummary(access.event, eventCounts, null),
    album: {
      id: album.id,
      rallyEventId: album.rallyEventId,
      title: album.title,
      description: album.description,
      albumDate: album.albumDate,
      coverImageUrl: album.coverImageUrl,
      sortOrder: album.sortOrder,
      createdAt: album.createdAt,
      ...albumCounts,
    },
    mediaPage,
  };
}
