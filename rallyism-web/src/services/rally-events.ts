import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { db } from "@/db";
import { albums, mediaItems, mediaTags, rallyEvents, tags, users } from "@/db/schema";
import { canContribute, isAdmin } from "@/lib/auth/authorization";
import {
  eventSupportsAlbumVisibilityControl,
  getEffectiveAlbumVisibility,
  type AlbumVisibility,
} from "@/lib/rally-events/album-visibility";
import {
  getTagSlug,
  normalizeTagName,
  parseTagNames,
} from "@/lib/rally-events/tags";
import {
  getYoutubeThumbnailUrl,
  parseYoutubeVideoId,
} from "@/lib/rally-events/youtube";
import { deleteR2Object } from "@/lib/storage/r2";
import type { AuthUser } from "@/services/users";

export type RallyEventChampionship = "WRC" | "ERC" | "national" | "other";
export type RallyEventVisibility = "private" | "public" | "unlisted";

export type RallyEventSummaryCounts = {
  albumsCount: number;
  mediaCount: number;
  photosCount: number;
  videosCount: number;
};

export type TagSummary = {
  id: number;
  name: string;
  slug: string;
};

export type AdminTagListItem = TagSummary & {
  createdAt: Date;
  mediaCount: number;
};

export class TagManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TagManagementError";
  }
}

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
} & RallyEventSummaryCounts;

export type RallyEventAlbum = {
  id: number;
  rallyEventId: number;
  title: string;
  description: string | null;
  albumDate: string | null;
  coverImageUrl: string | null;
  visibility: AlbumVisibility;
  effectiveVisibility: AlbumVisibility;
  sortOrder: number;
  createdById: number | null;
  creatorName: string | null;
  createdAt: Date;
} & RallyEventSummaryCounts;

export type AlbumFormInput = {
  title: string;
  description: string;
  albumDate: string;
  coverImageUrl: string;
  visibility?: string;
  sortOrder: string;
};

export type AlbumFormValues = {
  title: string;
  description: string | null;
  albumDate: string | null;
  coverImageUrl: string | null;
  visibility: AlbumVisibility;
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

export type VideoFormInput = {
  youtubeUrl: string;
  title: string;
  caption: string;
  sortOrder: string;
};

export type VideoFormValues = {
  youtubeUrl: string;
  youtubeVideoId: string;
  youtubeThumbnailUrl: string;
  title: string;
  caption: string | null;
  sortOrder: number;
};

export type PhotoFormInput = {
  title: string;
  caption: string;
  location: string;
  dateTaken: string;
  sortOrder: string;
  tags: string;
};

export type PhotoFormValues = {
  title: string | null;
  caption: string | null;
  location: string | null;
  dateTaken: Date | null;
  sortOrder: number;
  tagNames: string[];
};

export type AlbumMediaFilter = "all" | "photos" | "videos";

export type AlbumMediaItem = RallyEventMediaPreviewItem & {
  dateTaken: Date | null;
  location: string | null;
  sortOrder: number;
  createdById: number | null;
  createdAt: Date;
  tags: TagSummary[];
};

export type EditableVideoItem = {
  id: number;
  albumId: number;
  rallyEventId: number;
  title: string | null;
  caption: string | null;
  sortOrder: number;
  createdById: number | null;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  youtubeThumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EditablePhotoItem = {
  id: number;
  albumId: number;
  rallyEventId: number;
  title: string | null;
  caption: string | null;
  location: string | null;
  dateTaken: Date | null;
  sortOrder: number;
  createdById: number | null;
  thumbnailImageUrl: string | null;
  displayImageUrl: string | null;
  originalImageUrl: string | null;
  thumbnailImageR2Key: string | null;
  displayImageR2Key: string | null;
  originalImageR2Key: string | null;
  originalFilename: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: TagSummary[];
};

export type TaggedPhotoItem = {
  id: number;
  albumId: number;
  rallyEventId: number;
  title: string | null;
  caption: string | null;
  thumbnailImageUrl: string | null;
  displayImageUrl: string | null;
  originalImageUrl: string | null;
  eventTitle: string;
  rallyName: string;
  albumTitle: string;
  createdAt: Date;
};

export type TaggedPhotosPage =
  | { status: "not-found" }
  | {
      status: "allowed";
      tag: TagSummary;
      items: TaggedPhotoItem[];
      currentPage: number;
      pageSize: number;
      totalPhotos: number;
      totalPages: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
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

export type CreatableAlbumEvent = Pick<
  RallyEventSummary,
  | "id"
  | "title"
  | "rallyName"
  | "seasonYear"
  | "country"
  | "region"
  | "startDate"
  | "endDate"
  | "visibility"
>;

export type DashboardRallyEventVisibilityFilter =
  | "all"
  | RallyEventVisibility;

export type DashboardRallyEventChampionshipFilter =
  | "all"
  | RallyEventChampionship;

export type DashboardRallyEventsPage = {
  events: RallyEventSummary[];
  visibility: DashboardRallyEventVisibilityFilter;
  championship: DashboardRallyEventChampionshipFilter;
  year: number | null;
  search: string;
  currentPage: number;
  pageSize: number;
  totalEvents: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type AdminRallyEventVisibilityFilter =
  | "all"
  | RallyEventVisibility;

export type AdminRallyEventChampionshipFilter =
  | "all"
  | RallyEventChampionship;

export type AdminRallyEventListItem = RallyEventSummary & {
  creatorEmail: string | null;
};

export type AdminRallyEventsPage = {
  events: AdminRallyEventListItem[];
  visibility: AdminRallyEventVisibilityFilter;
  championship: AdminRallyEventChampionshipFilter;
  year: number | null;
  search: string;
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
      viewerPhotos: AlbumMediaItem[];
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

export class VideoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoValidationError";
  }
}

export class PhotoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoValidationError";
  }
}

export class PhotoStorageDeleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoStorageDeleteError";
  }
}

export class MediaStorageCleanupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaStorageCleanupError";
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

export type EditableVideoResult =
  | { status: "not-found" }
  | { status: "access-denied" }
  | {
      status: "allowed";
      event: RallyEventSummary;
      album: RallyEventAlbum;
      video: EditableVideoItem;
    };

export type EditablePhotoResult =
  | { status: "not-found" }
  | { status: "access-denied" }
  | {
      status: "allowed";
      event: RallyEventSummary;
      album: RallyEventAlbum;
      photo: EditablePhotoItem;
    };

const validChampionships = ["WRC", "ERC", "national", "other"] as const;
const validVisibilities = ["private", "public", "unlisted"] as const;
const validAlbumVisibilities = ["private", "public"] as const;

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

function userCanAccessAlbum(
  event: { visibility: RallyEventVisibility; createdById: number | null },
  album: { visibility: AlbumVisibility; createdById: number | null },
  currentUser: AuthUser | null,
) {
  if (!userCanAccessEvent(event, currentUser)) {
    return false;
  }

  if (getEffectiveAlbumVisibility(event.visibility, album.visibility) === "public") {
    return true;
  }

  return userCanManageEvent(event, currentUser) || userCanManageAlbum(album, currentUser);
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

export function userCanManageAlbum(
  album: { createdById: number | null },
  currentUser: AuthUser | null,
) {
  if (!currentUser) {
    return false;
  }

  return isAdmin(currentUser) || album.createdById === currentUser.id;
}

export function userCanCreateAlbumInEvent(
  event: { visibility: RallyEventVisibility; createdById: number | null },
  currentUser: AuthUser | null,
) {
  if (!canContribute(currentUser)) {
    return false;
  }

  if (event.visibility === "private") {
    return userCanManageEvent(event, currentUser);
  }

  return userCanAccessEvent(event, currentUser);
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

async function getOrCreateTag(name: string) {
  const normalizedName = normalizeTagName(name).slice(0, 80);
  const slug = getTagSlug(normalizedName);

  if (!normalizedName || !slug) {
    throw new PhotoValidationError("Enter valid tag names.");
  }

  const [existing] = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(tags)
    .values({ name: normalizedName, slug })
    .returning();

  return created;
}

export async function getTagsForMediaItem(mediaItemId: number) {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(mediaTags)
    .innerJoin(tags, eq(mediaTags.tagId, tags.id))
    .where(eq(mediaTags.mediaItemId, mediaItemId))
    .orderBy(asc(tags.name));
}

async function getTagsByMediaItemIds(mediaItemIds: number[]) {
  if (mediaItemIds.length === 0) {
    return new Map<number, TagSummary[]>();
  }

  const rows = await db
    .select({
      mediaItemId: mediaTags.mediaItemId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(mediaTags)
    .innerJoin(tags, eq(mediaTags.tagId, tags.id))
    .where(inArray(mediaTags.mediaItemId, mediaItemIds))
    .orderBy(asc(tags.name));

  const tagsByMediaItem = new Map<number, TagSummary[]>();

  for (const row of rows) {
    const current = tagsByMediaItem.get(row.mediaItemId) ?? [];
    current.push({ id: row.id, name: row.name, slug: row.slug });
    tagsByMediaItem.set(row.mediaItemId, current);
  }

  return tagsByMediaItem;
}

export async function setMediaItemTags(input: {
  mediaItemId: number;
  tagNames: string[];
}) {
  const nextTags = await Promise.all(input.tagNames.map(getOrCreateTag));

  await db.delete(mediaTags).where(eq(mediaTags.mediaItemId, input.mediaItemId));

  if (nextTags.length > 0) {
    await db
      .insert(mediaTags)
      .values(
        nextTags.map((tag) => ({
          mediaItemId: input.mediaItemId,
          tagId: tag.id,
        })),
      )
      .onConflictDoNothing();
  }
}

export async function searchTags(input: { query?: string; limit?: number } = {}) {
  const query = normalizeTagName(input.query ?? "");
  const tagQuery = db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(tags)
    .$dynamic();

  if (query) {
    tagQuery.where(ilike(tags.name, `%${query}%`));
  }

  const orderedTagQuery = tagQuery.orderBy(asc(tags.name));

  if (input.limit) {
    return orderedTagQuery.limit(input.limit);
  }

  return orderedTagQuery;
}

export async function getAdminTags() {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      createdAt: tags.createdAt,
      mediaCount: sql<number>`count(${mediaTags.mediaItemId})::int`,
    })
    .from(tags)
    .leftJoin(mediaTags, eq(mediaTags.tagId, tags.id))
    .groupBy(tags.id, tags.name, tags.slug, tags.createdAt)
    .orderBy(asc(tags.name));

  return rows satisfies AdminTagListItem[];
}

export async function updateTag(input: { name: string; tagId: number }) {
  const normalizedName = normalizeTagName(input.name).slice(0, 80);
  const slug = getTagSlug(normalizedName);

  if (!normalizedName || !slug) {
    throw new TagManagementError("Enter a valid tag name.");
  }

  const [existing] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.slug, slug), ne(tags.id, input.tagId)))
    .limit(1);

  if (existing) {
    throw new TagManagementError("Another tag already uses this name.");
  }

  const [updated] = await db
    .update(tags)
    .set({ name: normalizedName, slug })
    .where(eq(tags.id, input.tagId))
    .returning({ id: tags.id });

  if (!updated) {
    throw new TagManagementError("Tag not found.");
  }
}

export async function deleteTag(tagId: number) {
  const [deleted] = await db
    .delete(tags)
    .where(eq(tags.id, tagId))
    .returning({ id: tags.id });

  if (!deleted) {
    throw new TagManagementError("Tag not found.");
  }
}

export async function getTagBySlug(slug: string) {
  const [tag] = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);

  return tag ?? null;
}

function getTaggedPhotoAccessWhere(currentUser: AuthUser) {
  if (isAdmin(currentUser)) {
    return undefined;
  }

  return or(
    eq(rallyEvents.createdById, currentUser.id),
    eq(albums.createdById, currentUser.id),
    and(
      inArray(rallyEvents.visibility, ["public", "unlisted"]),
      eq(albums.visibility, "public"),
    ),
  );
}

export async function getTaggedPhotosPage(input: {
  slug: string;
  currentUser: AuthUser;
  page?: number;
  pageSize?: number;
}): Promise<TaggedPhotosPage> {
  const tag = await getTagBySlug(input.slug);

  if (!tag) {
    return { status: "not-found" };
  }

  const pageSize = input.pageSize ?? 24;
  const requestedPage =
    input.page && Number.isInteger(input.page) && input.page > 0 ? input.page : 1;
  const accessWhere = getTaggedPhotoAccessWhere(input.currentUser);
  const whereClause = accessWhere
    ? and(
        eq(mediaTags.tagId, tag.id),
        eq(mediaItems.type, "photo"),
        accessWhere,
      )
    : and(eq(mediaTags.tagId, tag.id), eq(mediaItems.type, "photo"));

  const [{ totalPhotos }] = await db
    .select({
      totalPhotos: sql<number>`count(${mediaItems.id})::int`,
    })
    .from(mediaTags)
    .innerJoin(mediaItems, eq(mediaTags.mediaItemId, mediaItems.id))
    .innerJoin(albums, eq(mediaItems.albumId, albums.id))
    .innerJoin(rallyEvents, eq(mediaItems.rallyEventId, rallyEvents.id))
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil((totalPhotos ?? 0) / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const items = await db
    .select({
      id: mediaItems.id,
      albumId: mediaItems.albumId,
      rallyEventId: mediaItems.rallyEventId,
      title: mediaItems.title,
      caption: mediaItems.caption,
      thumbnailImageUrl: mediaItems.thumbnailImageUrl,
      displayImageUrl: mediaItems.displayImageUrl,
      originalImageUrl: mediaItems.originalImageUrl,
      eventTitle: rallyEvents.title,
      rallyName: rallyEvents.rallyName,
      albumTitle: albums.title,
      createdAt: mediaItems.createdAt,
    })
    .from(mediaTags)
    .innerJoin(mediaItems, eq(mediaTags.mediaItemId, mediaItems.id))
    .innerJoin(albums, eq(mediaItems.albumId, albums.id))
    .innerJoin(rallyEvents, eq(mediaItems.rallyEventId, rallyEvents.id))
    .where(whereClause)
    .orderBy(desc(mediaItems.createdAt), asc(mediaItems.id))
    .limit(pageSize)
    .offset(offset);

  return {
    status: "allowed",
    tag,
    items,
    currentPage,
    pageSize,
    totalPhotos: totalPhotos ?? 0,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

function isValidDateOnly(value: string) {
  // Accept dd/mm/yyyy format
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false;
  }

  const [day, month, year] = value.split("/").map(Number);
  
  // Validate month and day ranges
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  
  // Check if the date is valid (e.g., not Feb 30)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function convertDateToIsoFormat(value: string): string {
  // Convert dd/mm/yyyy to yyyy-mm-dd for storage
  const [day, month, year] = value.split("/").map(num => num.padStart(2, "0"));
  return `${year}-${month}-${day}`;
}

export function formatDateForDisplay(dateString: string | null | undefined): string {
  // Convert yyyy-mm-dd to dd/mm/yyyy for display in forms
  if (!dateString) {
    return "";
  }

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function normalizeOptionalDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!isValidDateOnly(trimmed)) {
    throw new RallyEventValidationError("Enter valid rally dates in dd/mm/yyyy format.");
  }

  return convertDateToIsoFormat(trimmed);
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

function parseAlbumVisibility(value: string): AlbumVisibility {
  if (validAlbumVisibilities.includes(value as AlbumVisibility)) {
    return value as AlbumVisibility;
  }

  throw new AlbumValidationError("Choose a valid album visibility.");
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
    visibility: input.visibility
      ? parseAlbumVisibility(input.visibility)
      : "public",
    sortOrder,
  };
}

export function extractYoutubeVideoId(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new VideoValidationError("YouTube URL is required.");
  }

  const videoId = parseYoutubeVideoId(trimmed);

  if (!videoId) {
    throw new VideoValidationError("Enter a valid YouTube video URL.");
  }

  return videoId;
}

export function validateVideoInput(input: VideoFormInput): VideoFormValues {
  const youtubeVideoId = extractYoutubeVideoId(input.youtubeUrl);
  const title = input.title.trim() || "YouTube video";
  const sortOrderText = input.sortOrder.trim();
  const sortOrder = sortOrderText ? Number(sortOrderText) : 0;

  if (!Number.isInteger(sortOrder)) {
    throw new VideoValidationError("Sort order must be a whole number.");
  }

  return {
    youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
    youtubeVideoId,
    youtubeThumbnailUrl: getYoutubeThumbnailUrl(youtubeVideoId),
    title,
    caption: normalizeNullableText(input.caption),
    sortOrder,
  };
}

function parseOptionalDateTime(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    throw new PhotoValidationError("Enter a valid date taken.");
  }

  return date;
}

export function validatePhotoInput(input: PhotoFormInput): PhotoFormValues {
  const title = normalizeNullableText(input.title);
  const sortOrderText = input.sortOrder.trim();
  const sortOrder = sortOrderText ? Number(sortOrderText) : 0;

  if (title && title.length > 180) {
    throw new PhotoValidationError("Photo title must be 180 characters or fewer.");
  }

  if (input.location.trim().length > 180) {
    throw new PhotoValidationError("Location must be 180 characters or fewer.");
  }

  if (!Number.isInteger(sortOrder)) {
    throw new PhotoValidationError("Sort order must be a whole number.");
  }

  return {
    title,
    caption: normalizeNullableText(input.caption),
    location: normalizeNullableText(input.location),
    dateTaken: parseOptionalDateTime(input.dateTaken),
    sortOrder,
    tagNames: parseTagNames(input.tags),
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
  };
}

function summarizeVisibleAlbums(eventAlbums: RallyEventAlbum[]): RallyEventSummaryCounts {
  return eventAlbums.reduce<RallyEventSummaryCounts>(
    (totals, album) => ({
      albumsCount: totals.albumsCount + 1,
      mediaCount: totals.mediaCount + album.mediaCount,
      photosCount: totals.photosCount + album.photosCount,
      videosCount: totals.videosCount + album.videosCount,
    }),
    normalizeCounts(undefined),
  );
}

async function getAlbumRowsByEventIds(rallyEventIds?: number[]) {
  if (rallyEventIds && rallyEventIds.length === 0) {
    return [];
  }

  const query = db
    .select({
      album: albums,
      creatorName: users.name,
    })
    .from(albums)
    .leftJoin(users, eq(albums.createdById, users.id))
    .$dynamic();

  if (rallyEventIds) {
    query.where(inArray(albums.rallyEventId, rallyEventIds));
  }

  return query.orderBy(
    asc(albums.rallyEventId),
    asc(albums.sortOrder),
    asc(albums.albumDate),
    asc(albums.createdAt),
  );
}

async function getVisibleAlbumMaps(input: {
  events: Array<typeof rallyEvents.$inferSelect>;
  currentUser: AuthUser | null;
}) {
  const eventIds = input.events.map((event) => event.id);
  const [albumRows, countsByAlbum] = await Promise.all([
    getAlbumRowsByEventIds(eventIds),
    Promise.all(eventIds.map((eventId) => getAlbumCountsByAlbum(eventId))),
  ]);
  const countsByEventId = new Map<number, Map<number, RallyEventSummaryCounts>>(
    eventIds.map((eventId, index) => [eventId, countsByAlbum[index] ?? new Map()]),
  );
  const eventsById = new Map(input.events.map((event) => [event.id, event]));
  const albumsByEventId = new Map<number, RallyEventAlbum[]>();
  const summaryCountsByEventId = new Map<number, RallyEventSummaryCounts>();

  for (const event of input.events) {
    albumsByEventId.set(event.id, []);
    summaryCountsByEventId.set(event.id, normalizeCounts(undefined));
  }

  for (const row of albumRows) {
    const album = row.album;
    const event = eventsById.get(album.rallyEventId);

    if (!event || !userCanAccessAlbum(event, album, input.currentUser)) {
      continue;
    }

    const eventAlbum = toRallyEventAlbum(
      album,
      normalizeCounts({
        albumsCount: 0,
        ...countsByEventId.get(album.rallyEventId)?.get(album.id),
      }),
      event.visibility,
      row.creatorName,
    );
    const visibleAlbums = albumsByEventId.get(album.rallyEventId) ?? [];
    visibleAlbums.push(eventAlbum);
    albumsByEventId.set(album.rallyEventId, visibleAlbums);
  }

  for (const [eventId, visibleAlbums] of albumsByEventId) {
    summaryCountsByEventId.set(eventId, summarizeVisibleAlbums(visibleAlbums));
  }

  return { albumsByEventId, summaryCountsByEventId };
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
      createdById: mediaItems.createdById,
      createdAt: mediaItems.createdAt,
    })
    .from(mediaItems)
    .where(whereClause)
    .orderBy(asc(mediaItems.sortOrder), asc(mediaItems.dateTaken), asc(mediaItems.createdAt))
    .limit(pageSize)
    .offset(offset);
  const tagsByMediaItem = await getTagsByMediaItemIds(
    items.filter((item) => item.type === "photo").map((item) => item.id),
  );

  return {
    items: items.map((item) => ({
      ...item,
      tags: tagsByMediaItem.get(item.id) ?? [],
    })),
    filter,
    currentPage,
    pageSize,
    totalMedia: totalMedia ?? 0,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

async function getAlbumViewerPhotos(input: {
  rallyEventId: number;
  albumId: number;
}): Promise<AlbumMediaItem[]> {
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
      createdById: mediaItems.createdById,
      createdAt: mediaItems.createdAt,
    })
    .from(mediaItems)
    .where(
      and(
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.type, "photo"),
      ),
    )
    .orderBy(
      asc(mediaItems.sortOrder),
      asc(mediaItems.dateTaken),
      asc(mediaItems.createdAt),
    );
  const tagsByMediaItem = await getTagsByMediaItemIds(
    items.map((item) => item.id),
  );

  return items.map((item) => ({
    ...item,
    tags: tagsByMediaItem.get(item.id) ?? [],
  }));
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
    events: summaries.sort(
      (a, b) =>
        getSortTime(b.startDate) - getSortTime(a.startDate) ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    ),
  };
}

function getDashboardRallyEventsWhereClause(input: {
  currentUser: AuthUser;
  visibility: DashboardRallyEventVisibilityFilter;
  championship: DashboardRallyEventChampionshipFilter;
  year: number | null;
  search: string;
}) {
  const clauses: SQL[] = [];

  if (!isAdmin(input.currentUser)) {
    clauses.push(eq(rallyEvents.createdById, input.currentUser.id));
  }

  if (input.visibility !== "all") {
    clauses.push(eq(rallyEvents.visibility, input.visibility));
  }

  if (input.championship !== "all") {
    clauses.push(eq(rallyEvents.championship, input.championship));
  }

  if (input.year) {
    clauses.push(eq(rallyEvents.seasonYear, input.year));
  }

  if (input.search) {
    const pattern = `%${input.search}%`;
    const searchClause = or(
      ilike(rallyEvents.title, pattern),
      ilike(rallyEvents.rallyName, pattern),
      ilike(rallyEvents.country, pattern),
      ilike(rallyEvents.region, pattern),
    );

    if (searchClause) {
      clauses.push(searchClause);
    }
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function getDashboardRallyEventsPage(input: {
  currentUser: AuthUser;
  visibility?: DashboardRallyEventVisibilityFilter;
  championship?: DashboardRallyEventChampionshipFilter;
  year?: number | null;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<DashboardRallyEventsPage> {
  const visibility = input.visibility ?? "all";
  const championship = input.championship ?? "all";
  const year = input.year ?? null;
  const search = normalizeTagName(input.search ?? "").slice(0, 120);
  const pageSize = input.pageSize ?? 9;
  const requestedPage =
    input.page && Number.isInteger(input.page) && input.page > 0 ? input.page : 1;
  const whereClause = getDashboardRallyEventsWhereClause({
    currentUser: input.currentUser,
    visibility,
    championship,
    year,
    search,
  });
  const countQuery = db
    .select({
      totalEvents: sql<number>`count(${rallyEvents.id})::int`,
    })
    .from(rallyEvents)
    .$dynamic();

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [{ totalEvents }] = await countQuery;
  const totalPages = Math.max(1, Math.ceil((totalEvents ?? 0) / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const eventQuery = db
    .select({
      event: rallyEvents,
      creatorName: users.name,
    })
    .from(rallyEvents)
    .leftJoin(users, eq(rallyEvents.createdById, users.id))
    .orderBy(desc(rallyEvents.startDate), desc(rallyEvents.createdAt))
    .limit(pageSize)
    .offset(offset)
    .$dynamic();

  if (whereClause) {
    eventQuery.where(whereClause);
  }

  const eventRows = await eventQuery;
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
    visibility,
    championship,
    year,
    search,
    currentPage,
    pageSize,
    totalEvents: totalEvents ?? 0,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

export async function getDashboardRallyEventYearOptions(currentUser: AuthUser) {
  const query = db
    .select({
      year: rallyEvents.seasonYear,
    })
    .from(rallyEvents)
    .orderBy(desc(rallyEvents.seasonYear))
    .$dynamic();

  if (!isAdmin(currentUser)) {
    query.where(eq(rallyEvents.createdById, currentUser.id));
  }

  const rows = await query;

  return Array.from(new Set(rows.map((row) => row.year)));
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

  const { summaryCountsByEventId } = await getVisibleAlbumMaps({
    events: eventRows.map((row) => row.event),
    currentUser: null,
  });

  const events = eventRows.map((row) => {
    const counts = summaryCountsByEventId.get(row.event.id) ?? normalizeCounts(undefined);

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

function getAdminRallyEventsWhereClause(input: {
  visibility: AdminRallyEventVisibilityFilter;
  championship: AdminRallyEventChampionshipFilter;
  year: number | null;
  search: string;
}) {
  const clauses: SQL[] = [];

  if (input.visibility !== "all") {
    clauses.push(eq(rallyEvents.visibility, input.visibility));
  }

  if (input.championship !== "all") {
    clauses.push(eq(rallyEvents.championship, input.championship));
  }

  if (input.year) {
    clauses.push(eq(rallyEvents.seasonYear, input.year));
  }

  if (input.search) {
    const pattern = `%${input.search}%`;
    const searchClause = or(
      ilike(rallyEvents.title, pattern),
      ilike(rallyEvents.rallyName, pattern),
      ilike(rallyEvents.country, pattern),
      ilike(users.name, pattern),
      ilike(users.email, pattern),
    );

    if (searchClause) {
      clauses.push(searchClause);
    }
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function getAdminRallyEventsPage(input: {
  visibility?: AdminRallyEventVisibilityFilter;
  championship?: AdminRallyEventChampionshipFilter;
  year?: number | null;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminRallyEventsPage> {
  const visibility = input.visibility ?? "all";
  const championship = input.championship ?? "all";
  const year = input.year ?? null;
  const search = normalizeTagName(input.search ?? "").slice(0, 120);
  const pageSize = input.pageSize ?? 12;
  const requestedPage =
    input.page && Number.isInteger(input.page) && input.page > 0 ? input.page : 1;
  const whereClause = getAdminRallyEventsWhereClause({
    visibility,
    championship,
    year,
    search,
  });
  const countQuery = db
    .select({
      totalEvents: sql<number>`count(${rallyEvents.id})::int`,
    })
    .from(rallyEvents)
    .leftJoin(users, eq(rallyEvents.createdById, users.id))
    .$dynamic();

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [{ totalEvents }] = await countQuery;
  const totalPages = Math.max(1, Math.ceil((totalEvents ?? 0) / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const eventQuery = db
    .select({
      event: rallyEvents,
      creatorName: users.name,
      creatorEmail: users.email,
    })
    .from(rallyEvents)
    .leftJoin(users, eq(rallyEvents.createdById, users.id))
    .orderBy(desc(rallyEvents.updatedAt), desc(rallyEvents.createdAt), desc(rallyEvents.id))
    .limit(pageSize)
    .offset(offset)
    .$dynamic();

  if (whereClause) {
    eventQuery.where(whereClause);
  }

  const eventRows = await eventQuery;
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

    return {
      ...toRallyEventSummary(row.event, counts, row.creatorName),
      creatorEmail: row.creatorEmail,
    };
  });

  return {
    events,
    visibility,
    championship,
    year,
    search,
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
  input: {
    eventVisibility?: RallyEventVisibility;
    eventCreatedById?: number | null;
    currentUser?: AuthUser | null;
  } = {},
): Promise<RallyEventAlbum[]> {
  const [albumRows, countsByAlbum] = await Promise.all([
    db
      .select({
        album: albums,
        creatorName: users.name,
      })
      .from(albums)
      .leftJoin(users, eq(albums.createdById, users.id))
      .where(eq(albums.rallyEventId, rallyEventId))
      .orderBy(asc(albums.sortOrder), asc(albums.albumDate), asc(albums.createdAt)),
    getAlbumCountsByAlbum(rallyEventId),
  ]);
  const eventVisibility = input.eventVisibility ?? "public";
  const currentUser = input.currentUser ?? null;
  const visibleAlbums =
    input.eventVisibility === undefined
      ? albumRows
      : albumRows.filter((album) =>
          userCanAccessAlbum(
            {
              visibility: eventVisibility,
              createdById: input.eventCreatedById ?? null,
            },
            album.album,
            currentUser,
          ),
        );

  return visibleAlbums.map((row) =>
    toRallyEventAlbum(
      row.album,
      normalizeCounts({
        albumsCount: 0,
        ...countsByAlbum.get(row.album.id),
      }),
      eventVisibility,
      row.creatorName,
    ),
  );
}

function toRallyEventAlbum(
  album: typeof albums.$inferSelect,
  counts: RallyEventSummaryCounts,
  eventVisibility: RallyEventVisibility,
  creatorName: string | null,
): RallyEventAlbum {
  return {
    id: album.id,
    rallyEventId: album.rallyEventId,
    title: album.title,
    description: album.description,
    albumDate: album.albumDate,
    coverImageUrl: album.coverImageUrl,
    visibility: album.visibility,
    effectiveVisibility: getEffectiveAlbumVisibility(
      eventVisibility,
      album.visibility,
    ),
    sortOrder: album.sortOrder,
    createdById: album.createdById,
    creatorName,
    createdAt: album.createdAt,
    ...counts,
  };
}

export async function getRallyEventMediaPreview(
  rallyEventId: number,
  visibleAlbumIds?: number[],
  limit = 6,
): Promise<RallyEventMediaPreviewItem[]> {
  if (visibleAlbumIds && visibleAlbumIds.length === 0) {
    return [];
  }

  const whereClauses: SQL[] = [
    sql`${mediaItems.rallyEventId} = ${rallyEventId} and (${mediaItems.type} = 'video' or ${mediaItems.thumbnailImageUrl} is not null or ${mediaItems.displayImageUrl} is not null or ${mediaItems.originalImageUrl} is not null)`,
  ];

  if (visibleAlbumIds) {
    whereClauses.push(inArray(mediaItems.albumId, visibleAlbumIds));
  }

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
    .where(and(...whereClauses))
    .orderBy(sql`random()`)
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

  const eventAlbums = await getRallyEventAlbums(id, {
    eventVisibility: row.event.visibility,
    eventCreatedById: row.event.createdById,
    currentUser,
  });
  const counts = summarizeVisibleAlbums(eventAlbums);
  const mediaPreview = await getRallyEventMediaPreview(
    id,
    eventAlbums.map((album) => album.id),
    12,
  );

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

export async function getCreatableAlbumRallyEvent(
  id: number,
  currentUser: AuthUser | null,
): Promise<EditableRallyEventResult> {
  const access = await getRallyEventAccess(id, currentUser);

  if (access.status !== "allowed") {
    return access;
  }

  if (!userCanCreateAlbumInEvent(access.event, currentUser)) {
    return { status: "access-denied" };
  }

  const visibleAlbums = await getRallyEventAlbums(id, {
    eventVisibility: access.event.visibility,
    eventCreatedById: access.event.createdById,
    currentUser,
  });

  return {
    status: "allowed",
    event: toRallyEventSummary(access.event, summarizeVisibleAlbums(visibleAlbums), null),
  };
}

export async function getCreatableAlbumEvents(
  currentUser: AuthUser,
): Promise<CreatableAlbumEvent[]> {
  const whereClause = isAdmin(currentUser)
    ? undefined
    : or(
        eq(rallyEvents.visibility, "public"),
        eq(rallyEvents.createdById, currentUser.id),
      );
  const query = db
    .select({
      id: rallyEvents.id,
      title: rallyEvents.title,
      rallyName: rallyEvents.rallyName,
      seasonYear: rallyEvents.seasonYear,
      country: rallyEvents.country,
      region: rallyEvents.region,
      startDate: rallyEvents.startDate,
      endDate: rallyEvents.endDate,
      visibility: rallyEvents.visibility,
    })
    .from(rallyEvents)
    .orderBy(desc(rallyEvents.startDate), desc(rallyEvents.createdAt))
    .$dynamic();

  if (whereClause) {
    query.where(whereClause);
  }

  return await query;
}

export async function updateRallyEvent(input: {
  id: number;
  currentUser: AuthUser;
  values: RallyEventFormValues;
}) {
  if (!canContribute(input.currentUser)) {
    throw new RallyEventValidationError("Your account is not approved to edit rally events.");
  }

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

type MediaStorageKeyRow = {
  thumbnailImageR2Key: string | null;
  displayImageR2Key: string | null;
  originalImageR2Key: string | null;
};

function collectR2Keys(
  mediaRows: MediaStorageKeyRow[],
  coverKeys: Array<string | null | undefined> = [],
) {
  const keys = new Set<string>();

  for (const key of coverKeys) {
    if (key) {
      keys.add(key);
    }
  }

  for (const row of mediaRows) {
    if (row.thumbnailImageR2Key) {
      keys.add(row.thumbnailImageR2Key);
    }

    if (row.displayImageR2Key) {
      keys.add(row.displayImageR2Key);
    }

    if (row.originalImageR2Key) {
      keys.add(row.originalImageR2Key);
    }
  }

  return [...keys];
}

async function deleteR2KeysOrThrow(keys: string[]) {
  const results = await Promise.allSettled(keys.map(deleteR2Object));
  const failedCount = results.filter((result) => result.status === "rejected").length;

  if (failedCount > 0) {
    throw new MediaStorageCleanupError(
      `${failedCount} storage object${failedCount === 1 ? "" : "s"} could not be deleted. Try again before deleting this content.`,
    );
  }
}

export async function createAlbum(input: {
  rallyEventId: number;
  currentUser: AuthUser;
  values: AlbumFormValues;
}) {
  if (!canContribute(input.currentUser)) {
    throw new AlbumValidationError("Your account is not approved to create albums.");
  }

  const eventAccess = await getCreatableAlbumRallyEvent(
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
      visibility: eventSupportsAlbumVisibilityControl(eventAccess.event.visibility)
        ? input.values.visibility
        : "private",
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
  const eventAccess = await getRallyEventAccess(input.rallyEventId, input.currentUser);

  if (eventAccess.status !== "allowed") {
    return eventAccess;
  }

  const [albumRow] = await db
    .select({
      album: albums,
      creatorName: users.name,
    })
    .from(albums)
    .leftJoin(users, eq(albums.createdById, users.id))
    .where(
      and(
        eq(albums.id, input.albumId),
        eq(albums.rallyEventId, input.rallyEventId),
      ),
    )
    .limit(1);

  if (!albumRow) {
    return { status: "not-found" };
  }

  const album = albumRow.album;

  if (!userCanManageAlbum(album, input.currentUser)) {
    return { status: "access-denied" };
  }

  const albumCounts = await getSingleAlbumMediaCounts(input.albumId);

  return {
    status: "allowed",
    event: eventAccess.event,
    album: toRallyEventAlbum(
      album,
      albumCounts,
      eventAccess.event.visibility,
      albumRow.creatorName,
    ),
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
      visibility: eventSupportsAlbumVisibilityControl(access.event.visibility)
        ? input.values.visibility
        : "private",
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

export async function deleteAlbum(input: {
  rallyEventId: number;
  albumId: number;
  currentUser: AuthUser;
}) {
  if (!canContribute(input.currentUser)) {
    throw new AlbumValidationError("Your account is not approved to delete albums.");
  }

  const access = await getEditableAlbum({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    currentUser: input.currentUser,
  });

  if (access.status !== "allowed") {
    return access;
  }

  const [albumRow, mediaRows] = await Promise.all([
    db
      .select({
        coverImageR2Key: albums.coverImageR2Key,
      })
      .from(albums)
      .where(
        and(
          eq(albums.id, input.albumId),
          eq(albums.rallyEventId, input.rallyEventId),
        ),
      )
      .limit(1),
    db
      .select({
        thumbnailImageR2Key: mediaItems.thumbnailImageR2Key,
        displayImageR2Key: mediaItems.displayImageR2Key,
        originalImageR2Key: mediaItems.originalImageR2Key,
      })
      .from(mediaItems)
      .where(
        and(
          eq(mediaItems.albumId, input.albumId),
          eq(mediaItems.rallyEventId, input.rallyEventId),
          eq(mediaItems.type, "photo"),
        ),
      ),
  ]);

  await deleteR2KeysOrThrow(
    collectR2Keys(mediaRows, [albumRow[0]?.coverImageR2Key]),
  );

  await db
    .delete(albums)
    .where(
      and(
        eq(albums.id, input.albumId),
        eq(albums.rallyEventId, input.rallyEventId),
      ),
    );

  return { status: "allowed" as const };
}

export async function deleteRallyEvent(input: {
  rallyEventId: number;
  currentUser: AuthUser;
}) {
  if (!canContribute(input.currentUser)) {
    throw new RallyEventValidationError(
      "Your account is not approved to delete rally events.",
    );
  }

  const access = await getEditableRallyEvent(
    input.rallyEventId,
    input.currentUser,
  );

  if (access.status !== "allowed") {
    return access;
  }

  const [eventRows, albumRows, mediaRows] = await Promise.all([
    db
      .select({
        coverImageR2Key: rallyEvents.coverImageR2Key,
      })
      .from(rallyEvents)
      .where(eq(rallyEvents.id, input.rallyEventId))
      .limit(1),
    db
      .select({
        coverImageR2Key: albums.coverImageR2Key,
      })
      .from(albums)
      .where(eq(albums.rallyEventId, input.rallyEventId)),
    db
      .select({
        thumbnailImageR2Key: mediaItems.thumbnailImageR2Key,
        displayImageR2Key: mediaItems.displayImageR2Key,
        originalImageR2Key: mediaItems.originalImageR2Key,
      })
      .from(mediaItems)
      .where(
        and(
          eq(mediaItems.rallyEventId, input.rallyEventId),
          eq(mediaItems.type, "photo"),
        ),
      ),
  ]);

  await deleteR2KeysOrThrow(
    collectR2Keys(mediaRows, [
      eventRows[0]?.coverImageR2Key,
      ...albumRows.map((album) => album.coverImageR2Key),
    ]),
  );

  await db.delete(rallyEvents).where(eq(rallyEvents.id, input.rallyEventId));

  return { status: "allowed" as const };
}

export function userCanManageVideo(
  album: { createdById: number | null },
  currentUser: AuthUser | null,
) {
  return userCanManageAlbum(album, currentUser);
}

export async function createVideo(input: {
  rallyEventId: number;
  albumId: number;
  currentUser: AuthUser;
  values: VideoFormValues;
}) {
  if (!canContribute(input.currentUser)) {
    throw new VideoValidationError("Your account is not approved to add videos.");
  }

  const albumAccess = await getEditableAlbum({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    currentUser: input.currentUser,
  });

  if (albumAccess.status !== "allowed") {
    return albumAccess;
  }

  const [video] = await db
    .insert(mediaItems)
    .values({
      albumId: input.albumId,
      rallyEventId: input.rallyEventId,
      type: "video",
      title: input.values.title,
      caption: input.values.caption,
      sortOrder: input.values.sortOrder,
      createdById: input.currentUser.id,
      youtubeUrl: input.values.youtubeUrl,
      youtubeVideoId: input.values.youtubeVideoId,
      youtubeThumbnailUrl: input.values.youtubeThumbnailUrl,
      updatedAt: new Date(),
    })
    .returning();

  return { status: "allowed" as const, video };
}

export async function getEditableVideo(input: {
  rallyEventId: number;
  albumId: number;
  mediaId: number;
  currentUser: AuthUser | null;
}): Promise<EditableVideoResult> {
  const albumAccess = await getAlbumMediaGalleryDetails({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    currentUser: input.currentUser,
    pageSize: 1,
  });

  if (albumAccess.status !== "allowed") {
    return albumAccess;
  }

  const [video] = await db
    .select({
      id: mediaItems.id,
      albumId: mediaItems.albumId,
      rallyEventId: mediaItems.rallyEventId,
      title: mediaItems.title,
      caption: mediaItems.caption,
      sortOrder: mediaItems.sortOrder,
      createdById: mediaItems.createdById,
      youtubeUrl: mediaItems.youtubeUrl,
      youtubeVideoId: mediaItems.youtubeVideoId,
      youtubeThumbnailUrl: mediaItems.youtubeThumbnailUrl,
      createdAt: mediaItems.createdAt,
      updatedAt: mediaItems.updatedAt,
    })
    .from(mediaItems)
    .where(
      and(
        eq(mediaItems.id, input.mediaId),
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "video"),
      ),
    )
    .limit(1);

  if (!video) {
    return { status: "not-found" };
  }

  if (!userCanManageVideo(albumAccess.album, input.currentUser)) {
    return { status: "access-denied" };
  }

  return {
    status: "allowed",
    event: albumAccess.event,
    album: albumAccess.album,
    video,
  };
}

export async function updateVideo(input: {
  rallyEventId: number;
  albumId: number;
  mediaId: number;
  currentUser: AuthUser;
  values: VideoFormValues;
}) {
  const access = await getEditableVideo({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    mediaId: input.mediaId,
    currentUser: input.currentUser,
  });

  if (access.status !== "allowed") {
    return access;
  }

  const [video] = await db
    .update(mediaItems)
    .set({
      title: input.values.title,
      caption: input.values.caption,
      sortOrder: input.values.sortOrder,
      youtubeUrl: input.values.youtubeUrl,
      youtubeVideoId: input.values.youtubeVideoId,
      youtubeThumbnailUrl: input.values.youtubeThumbnailUrl,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(mediaItems.id, input.mediaId),
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "video"),
      ),
    )
    .returning();

  return { status: "allowed" as const, video };
}

export async function deleteVideo(input: {
  rallyEventId: number;
  albumId: number;
  mediaId: number;
  currentUser: AuthUser;
}) {
  const access = await getEditableVideo({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    mediaId: input.mediaId,
    currentUser: input.currentUser,
  });

  if (access.status !== "allowed") {
    return access;
  }

  await db
    .delete(mediaItems)
    .where(
      and(
        eq(mediaItems.id, input.mediaId),
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "video"),
      ),
    );

  return { status: "allowed" as const };
}

export async function bulkDeleteVideos(input: {
  rallyEventId: number;
  albumId: number;
  mediaIds: number[];
  currentUser: AuthUser;
}) {
  if (!canContribute(input.currentUser)) {
    throw new VideoValidationError("Your account is not approved to delete videos.");
  }

  const uniqueMediaIds = [...new Set(input.mediaIds)];

  if (uniqueMediaIds.length === 0) {
    throw new VideoValidationError("Select at least one video to delete.");
  }

  const albumAccess = await getAlbumMediaGalleryDetails({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    currentUser: input.currentUser,
    pageSize: 1,
  });

  if (albumAccess.status !== "allowed") {
    return albumAccess;
  }

  const videoRows = await db
    .select({
      id: mediaItems.id,
      createdById: mediaItems.createdById,
    })
    .from(mediaItems)
    .where(
      and(
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "video"),
        inArray(mediaItems.id, uniqueMediaIds),
      ),
    );

  if (videoRows.length !== uniqueMediaIds.length) {
    throw new VideoValidationError("One or more selected items are not valid videos.");
  }

  const unauthorizedVideo = videoRows.find(() =>
    !userCanManageVideo(albumAccess.album, input.currentUser),
  );

  if (unauthorizedVideo) {
    return { status: "access-denied" as const };
  }

  await db
    .delete(mediaItems)
    .where(
      and(
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "video"),
        inArray(mediaItems.id, uniqueMediaIds),
      ),
    );

  return {
    status: "allowed" as const,
    deletedCount: uniqueMediaIds.length,
  };
}

export function userCanManagePhoto(
  album: { createdById: number | null },
  currentUser: AuthUser | null,
) {
  return userCanManageAlbum(album, currentUser);
}

export async function getEditablePhoto(input: {
  rallyEventId: number;
  albumId: number;
  mediaId: number;
  currentUser: AuthUser | null;
}): Promise<EditablePhotoResult> {
  const albumAccess = await getAlbumMediaGalleryDetails({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    currentUser: input.currentUser,
    pageSize: 1,
  });

  if (albumAccess.status !== "allowed") {
    return albumAccess;
  }

  const [photo] = await db
    .select({
      id: mediaItems.id,
      albumId: mediaItems.albumId,
      rallyEventId: mediaItems.rallyEventId,
      title: mediaItems.title,
      caption: mediaItems.caption,
      location: mediaItems.location,
      dateTaken: mediaItems.dateTaken,
      sortOrder: mediaItems.sortOrder,
      createdById: mediaItems.createdById,
      thumbnailImageUrl: mediaItems.thumbnailImageUrl,
      displayImageUrl: mediaItems.displayImageUrl,
      originalImageUrl: mediaItems.originalImageUrl,
      thumbnailImageR2Key: mediaItems.thumbnailImageR2Key,
      displayImageR2Key: mediaItems.displayImageR2Key,
      originalImageR2Key: mediaItems.originalImageR2Key,
      originalFilename: mediaItems.originalFilename,
      createdAt: mediaItems.createdAt,
      updatedAt: mediaItems.updatedAt,
    })
    .from(mediaItems)
    .where(
      and(
        eq(mediaItems.id, input.mediaId),
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "photo"),
      ),
    )
    .limit(1);

  if (!photo) {
    return { status: "not-found" };
  }

  if (!userCanManagePhoto(albumAccess.album, input.currentUser)) {
    return { status: "access-denied" };
  }

  const photoTags = await getTagsForMediaItem(photo.id);

  return {
    status: "allowed",
    event: albumAccess.event,
    album: albumAccess.album,
    photo: {
      ...photo,
      tags: photoTags,
    },
  };
}

export async function updatePhoto(input: {
  rallyEventId: number;
  albumId: number;
  mediaId: number;
  currentUser: AuthUser;
  values: PhotoFormValues;
}) {
  if (!canContribute(input.currentUser)) {
    throw new PhotoValidationError("Your account is not approved to edit photos.");
  }

  const access = await getEditablePhoto({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    mediaId: input.mediaId,
    currentUser: input.currentUser,
  });

  if (access.status !== "allowed") {
    return access;
  }

  const [photo] = await db
    .update(mediaItems)
    .set({
      title: input.values.title,
      caption: input.values.caption,
      location: input.values.location,
      dateTaken: input.values.dateTaken,
      sortOrder: input.values.sortOrder,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(mediaItems.id, input.mediaId),
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "photo"),
      ),
    )
    .returning();

  await setMediaItemTags({
    mediaItemId: input.mediaId,
    tagNames: input.values.tagNames,
  });

  return { status: "allowed" as const, photo };
}

function getPhotoR2Keys(photo: EditablePhotoItem) {
  return [
    photo.thumbnailImageR2Key,
    photo.displayImageR2Key,
    photo.originalImageR2Key,
  ].filter((key): key is string => Boolean(key));
}

export async function deletePhoto(input: {
  rallyEventId: number;
  albumId: number;
  mediaId: number;
  currentUser: AuthUser;
}) {
  if (!canContribute(input.currentUser)) {
    throw new PhotoValidationError("Your account is not approved to delete photos.");
  }

  const access = await getEditablePhoto({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    mediaId: input.mediaId,
    currentUser: input.currentUser,
  });

  if (access.status !== "allowed") {
    return access;
  }

  try {
    await Promise.all(getPhotoR2Keys(access.photo).map(deleteR2Object));
  } catch {
    throw new PhotoStorageDeleteError(
      "The photo files could not be deleted from storage. Try again before removing the photo.",
    );
  }

  await db
    .delete(mediaItems)
    .where(
      and(
        eq(mediaItems.id, input.mediaId),
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "photo"),
      ),
    );

  return { status: "allowed" as const };
}

export async function bulkDeletePhotos(input: {
  rallyEventId: number;
  albumId: number;
  mediaIds: number[];
  currentUser: AuthUser;
}) {
  if (!canContribute(input.currentUser)) {
    throw new PhotoValidationError("Your account is not approved to delete photos.");
  }

  const uniqueMediaIds = [...new Set(input.mediaIds)];

  if (uniqueMediaIds.length === 0) {
    throw new PhotoValidationError("Select at least one photo to delete.");
  }

  const albumAccess = await getAlbumMediaGalleryDetails({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    currentUser: input.currentUser,
    pageSize: 1,
  });

  if (albumAccess.status !== "allowed") {
    return albumAccess;
  }

  const photoRows = await db
    .select({
      id: mediaItems.id,
      createdById: mediaItems.createdById,
      thumbnailImageR2Key: mediaItems.thumbnailImageR2Key,
      displayImageR2Key: mediaItems.displayImageR2Key,
      originalImageR2Key: mediaItems.originalImageR2Key,
    })
    .from(mediaItems)
    .where(
      and(
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "photo"),
        inArray(mediaItems.id, uniqueMediaIds),
      ),
    );

  if (photoRows.length !== uniqueMediaIds.length) {
    throw new PhotoValidationError("One or more selected items are not valid photos.");
  }

  const unauthorizedPhoto = photoRows.find(() =>
    !userCanManagePhoto(albumAccess.album, input.currentUser),
  );

  if (unauthorizedPhoto) {
    return { status: "access-denied" as const };
  }

  await deleteR2KeysOrThrow(collectR2Keys(photoRows));

  await db
    .delete(mediaItems)
    .where(
      and(
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.rallyEventId, input.rallyEventId),
        eq(mediaItems.type, "photo"),
        inArray(mediaItems.id, uniqueMediaIds),
      ),
    );

  return {
    status: "allowed" as const,
    deletedCount: uniqueMediaIds.length,
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

  if (!userCanAccessAlbum(access.event, album, input.currentUser)) {
    return { status: "access-denied" as const };
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

  const [albumRow] = await db
    .select({
      album: albums,
      creatorName: users.name,
    })
    .from(albums)
    .leftJoin(users, eq(albums.createdById, users.id))
    .where(
      and(
        eq(albums.id, input.albumId),
        eq(albums.rallyEventId, input.rallyEventId),
      ),
    )
    .limit(1);

  if (!albumRow) {
    return { status: "not-found" };
  }

  const album = albumRow.album;

  if (!userCanAccessAlbum(access.event, album, input.currentUser)) {
    return { status: "access-denied" };
  }

  const visibleEventAlbums = await getRallyEventAlbums(input.rallyEventId, {
    eventVisibility: access.event.visibility,
    eventCreatedById: access.event.createdById,
    currentUser: input.currentUser,
  });
  const [albumCounts, mediaPage, viewerPhotos] = await Promise.all([
    getSingleAlbumMediaCounts(input.albumId),
    getAlbumMediaPage({
      rallyEventId: input.rallyEventId,
      albumId: input.albumId,
      filter: input.filter,
      page: input.page,
      pageSize: input.pageSize,
    }),
    getAlbumViewerPhotos({
      rallyEventId: input.rallyEventId,
      albumId: input.albumId,
    }),
  ]);
  const eventCounts = summarizeVisibleAlbums(visibleEventAlbums);

  return {
    status: "allowed",
    event: toRallyEventSummary(access.event, eventCounts, null),
    album: toRallyEventAlbum(
      album,
      albumCounts,
      access.event.visibility,
      albumRow.creatorName,
    ),
    mediaPage,
    viewerPhotos,
  };
}
