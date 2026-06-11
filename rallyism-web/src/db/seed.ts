import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  albums,
  favorites,
  mediaComments,
  mediaItems,
  mediaTags,
  rallyEvents,
  tags,
  users,
} from "./schema";

config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const db = drizzle(neon(databaseUrl));

const samplePassword = "pass123";
const samplePasswordHash = bcrypt.hashSync(samplePassword, 10);

async function getOrCreateUser(input: {
  email: string;
  name: string;
  role: "user" | "admin";
  approvalStatus: "pending" | "approved" | "rejected";
  photoUrl?: string;
}) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        name: input.name,
        passwordHash: samplePasswordHash,
        role: input.role,
        approvalStatus: input.approvalStatus,
        photoUrl: input.photoUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      passwordHash: samplePasswordHash,
      role: input.role,
      approvalStatus: input.approvalStatus,
      photoUrl: input.photoUrl,
    })
    .returning();

  return created;
}

async function getOrCreateRallyEvent(input: {
  title: string;
  rallyName: string;
  championship: "WRC" | "ERC" | "national" | "other";
  seasonYear: number;
  country: string;
  region: string;
  startDate: string;
  endDate: string;
  description: string;
  coverImageUrl: string;
  coverImageR2Key: string;
  visibility: "private" | "public" | "unlisted";
  featured: boolean;
  createdById: number;
}) {
  const [existing] = await db
    .select()
    .from(rallyEvents)
    .where(
      and(
        eq(rallyEvents.title, input.title),
        eq(rallyEvents.seasonYear, input.seasonYear),
        eq(rallyEvents.country, input.country),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db.insert(rallyEvents).values(input).returning();
  return created;
}

async function getOrCreateAlbum(input: {
  rallyEventId: number;
  title: string;
  description: string;
  albumDate: string;
  coverImageUrl?: string;
  coverImageR2Key?: string;
  visibility?: "private" | "public";
  sortOrder: number;
  createdById: number;
}) {
  const [existing] = await db
    .select()
    .from(albums)
    .where(
      and(eq(albums.rallyEventId, input.rallyEventId), eq(albums.title, input.title)),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db.insert(albums).values(input).returning();
  return created;
}

async function getOrCreateMediaItem(input: typeof mediaItems.$inferInsert) {
  const [existing] = await db
    .select()
    .from(mediaItems)
    .where(
      and(
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.type, input.type),
        eq(mediaItems.title, input.title ?? ""),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db.insert(mediaItems).values(input).returning();
  return created;
}

async function getOrCreateTag(input: { name: string; slug: string }) {
  const [existing] = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, input.slug))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db.insert(tags).values(input).returning();
  return created;
}

async function assignTag(mediaItemId: number, tagId: number) {
  await db
    .insert(mediaTags)
    .values({ mediaItemId, tagId })
    .onConflictDoNothing();
}

async function addFavorite(userId: number, mediaItemId: number) {
  await db
    .insert(favorites)
    .values({ userId, mediaItemId })
    .onConflictDoNothing();
}

async function addComment(input: { mediaItemId: number; userId: number; text: string }) {
  const [existing] = await db
    .select()
    .from(mediaComments)
    .where(
      and(
        eq(mediaComments.mediaItemId, input.mediaItemId),
        eq(mediaComments.userId, input.userId),
        eq(mediaComments.text, input.text),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(mediaComments).values(input);
  }
}

async function main() {
  const admin = await getOrCreateUser({
    email: "admin@rallyism.test",
    name: "Rallyism Admin",
    role: "admin",
    approvalStatus: "approved",
    photoUrl: "https://images.rallyism.test/users/admin.jpg",
  });

  const member = await getOrCreateUser({
    email: "fan@rallyism.test",
    name: "Rally Fan",
    role: "user",
    approvalStatus: "approved",
    photoUrl: "https://images.rallyism.test/users/fan.jpg",
  });

  const portugal = await getOrCreateRallyEvent({
    title: "WRC Rally Portugal 2025",
    rallyName: "Rally Portugal",
    championship: "WRC",
    seasonYear: 2025,
    country: "Portugal",
    region: "Porto and Matosinhos",
    startDate: "2025-05-15",
    endDate: "2025-05-18",
    description: "Sample WRC memory collection with stages, service park moments, and videos.",
    coverImageUrl: "https://images.rallyism.test/rallies/portugal-2025/cover.jpg",
    coverImageR2Key: "rallies/portugal-2025/cover.jpg",
    visibility: "public",
    featured: true,
    createdById: admin.id,
  });

  const monteCarlo = await getOrCreateRallyEvent({
    title: "Rallye Monte-Carlo 2024",
    rallyName: "Rallye Monte-Carlo",
    championship: "WRC",
    seasonYear: 2024,
    country: "Monaco",
    region: "Gap and Monte-Carlo",
    startDate: "2024-01-25",
    endDate: "2024-01-28",
    description: "Winter stages and road trip memories from a classic Monte-Carlo weekend.",
    coverImageUrl: "https://images.rallyism.test/rallies/monte-carlo-2024/cover.jpg",
    coverImageR2Key: "rallies/monte-carlo-2024/cover.jpg",
    visibility: "unlisted",
    featured: false,
    createdById: admin.id,
  });

  const fridayStages = await getOrCreateAlbum({
    rallyEventId: portugal.id,
    title: "Friday stages",
    description: "Dusty roads, fast corners, and the first full day of action.",
    albumDate: "2025-05-16",
    coverImageUrl: "https://images.rallyism.test/rallies/portugal-2025/friday-cover.jpg",
    coverImageR2Key: "rallies/portugal-2025/friday-cover.jpg",
    visibility: "public",
    sortOrder: 10,
    createdById: admin.id,
  });

  const servicePark = await getOrCreateAlbum({
    rallyEventId: portugal.id,
    title: "Service park",
    description: "Teams, friends, regroup moments, and close-up car details.",
    albumDate: "2025-05-17",
    coverImageUrl: "https://images.rallyism.test/rallies/portugal-2025/service-cover.jpg",
    coverImageR2Key: "rallies/portugal-2025/service-cover.jpg",
    visibility: "public",
    sortOrder: 20,
    createdById: admin.id,
  });

  const onboardVideos = await getOrCreateAlbum({
    rallyEventId: monteCarlo.id,
    title: "Onboard and YouTube videos",
    description: "Unlisted video links and saved thumbnails for later playback.",
    albumDate: "2024-01-27",
    visibility: "public",
    sortOrder: 10,
    createdById: admin.id,
  });

  const jumpPhoto = await getOrCreateMediaItem({
    albumId: fridayStages.id,
    rallyEventId: portugal.id,
    type: "photo",
    title: "Dusty jump",
    caption: "A 16:9 stage photo prepared for the gallery viewer.",
    dateTaken: new Date("2025-05-16T11:20:00Z"),
    location: "Arganil stage",
    sortOrder: 10,
    createdById: admin.id,
    originalImageUrl: "https://images.rallyism.test/rallies/portugal-2025/dusty-jump-original.jpg",
    originalImageR2Key: "rallies/portugal-2025/dusty-jump-original.jpg",
    thumbnailImageUrl: "https://images.rallyism.test/rallies/portugal-2025/dusty-jump-thumb.jpg",
    thumbnailImageR2Key: "rallies/portugal-2025/dusty-jump-thumb.jpg",
    displayImageUrl: "https://images.rallyism.test/rallies/portugal-2025/dusty-jump-display.jpg",
    displayImageR2Key: "rallies/portugal-2025/dusty-jump-display.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 2457600,
    width: 1920,
    height: 1080,
    aspectRatio: "1.7778",
  });

  const servicePhoto = await getOrCreateMediaItem({
    albumId: servicePark.id,
    rallyEventId: portugal.id,
    type: "photo",
    title: "Service park details",
    caption: "A 4:3 photo for testing mixed aspect ratios in the UI.",
    dateTaken: new Date("2025-05-17T15:05:00Z"),
    location: "Matosinhos service park",
    sortOrder: 10,
    createdById: admin.id,
    originalImageUrl: "https://images.rallyism.test/rallies/portugal-2025/service-details-original.jpg",
    originalImageR2Key: "rallies/portugal-2025/service-details-original.jpg",
    thumbnailImageUrl: "https://images.rallyism.test/rallies/portugal-2025/service-details-thumb.jpg",
    thumbnailImageR2Key: "rallies/portugal-2025/service-details-thumb.jpg",
    displayImageUrl: "https://images.rallyism.test/rallies/portugal-2025/service-details-display.jpg",
    displayImageR2Key: "rallies/portugal-2025/service-details-display.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 1843200,
    width: 1600,
    height: 1200,
    aspectRatio: "1.3333",
  });

  const onboardVideo = await getOrCreateMediaItem({
    albumId: onboardVideos.id,
    rallyEventId: monteCarlo.id,
    type: "video",
    title: "Monte-Carlo onboard notes",
    caption: "Sample YouTube metadata only; no video upload is stored in Rallyism.",
    dateTaken: new Date("2024-01-27T18:30:00Z"),
    location: "Col de Turini",
    sortOrder: 10,
    createdById: admin.id,
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeVideoId: "dQw4w9WgXcQ",
    youtubeThumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  });

  const tagInputs = [
    { name: "Stage", slug: "stage" },
    { name: "Service park", slug: "service-park" },
    { name: "Cars", slug: "cars" },
    { name: "WRC", slug: "wrc" },
    { name: "Road trip", slug: "road-trip" },
    { name: "Lappi", slug: "lappi" },
    { name: "Toyota", slug: "toyota" },
    { name: "Hyundai", slug: "hyundai" },
  ];

  const createdTags = await Promise.all(tagInputs.map(getOrCreateTag));
  const tagBySlug = new Map(createdTags.map((tag) => [tag.slug, tag]));

  await assignTag(jumpPhoto.id, tagBySlug.get("stage")!.id);
  await assignTag(jumpPhoto.id, tagBySlug.get("cars")!.id);
  await assignTag(jumpPhoto.id, tagBySlug.get("wrc")!.id);
  await assignTag(jumpPhoto.id, tagBySlug.get("lappi")!.id);
  await assignTag(jumpPhoto.id, tagBySlug.get("toyota")!.id);
  await assignTag(servicePhoto.id, tagBySlug.get("service-park")!.id);
  await assignTag(servicePhoto.id, tagBySlug.get("cars")!.id);
  await assignTag(servicePhoto.id, tagBySlug.get("hyundai")!.id);
  await assignTag(onboardVideo.id, tagBySlug.get("road-trip")!.id);
  await assignTag(onboardVideo.id, tagBySlug.get("wrc")!.id);

  await addFavorite(member.id, jumpPhoto.id);
  await addFavorite(member.id, onboardVideo.id);

  await addComment({
    mediaItemId: jumpPhoto.id,
    userId: member.id,
    text: "Perfect sample for checking the photo viewer layout.",
  });

  console.log("Seed data ready:");
  console.log(`- users: ${admin.email}, ${member.email}`);
  console.log(`- sample password for both users: ${samplePassword}`);
  console.log(`- rally events: ${portugal.title}, ${monteCarlo.title}`);
  console.log(`- albums: ${fridayStages.title}, ${servicePark.title}, ${onboardVideos.title}`);
  console.log(`- media items: ${jumpPhoto.title}, ${servicePhoto.title}, ${onboardVideo.title}`);
  console.log(`- tags: ${createdTags.map((tag) => tag.slug).join(", ")}`);
}

main().catch((error) => {
  console.error("Failed to seed database:");
  console.error(error);
  process.exit(1);
});
