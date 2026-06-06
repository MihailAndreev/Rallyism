import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { mediaItems, uploadBatches } from "@/db/schema";
import { canContribute } from "@/lib/auth/authorization";
import { getEditableAlbum } from "@/services/rally-events";
import type { AuthUser } from "@/services/users";

export const PHOTO_UPLOAD_MAX_FILES = 10;
export const PHOTO_UPLOAD_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type UploadedPhotoResult = {
  filename: string;
  mediaItemId: number;
};

type FailedPhotoResult = {
  filename: string;
  error: string;
};

export type PhotoUploadResult = {
  batchId: number;
  status: "completed" | "completed_with_errors" | "failed";
  uploaded: UploadedPhotoResult[];
  failed: FailedPhotoResult[];
};

export class PhotoUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoUploadValidationError";
  }
}

const acceptedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const rejectedExtensions = new Set([".heic", ".heif"]);

function getOriginalFilename(file: File) {
  return file.name?.trim() || "photo";
}

function getDisplayName(filename: string) {
  const parsed = path.parse(filename);

  return parsed.name || "Photo";
}

function sanitizeFilenamePart(value: string) {
  const parsed = path.parse(value);
  const base = parsed.name || "photo";

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "photo";
}

function assertPhotoFile(file: File) {
  const filename = getOriginalFilename(file);
  const extension = path.extname(filename).toLowerCase();

  if (file.size <= 0) {
    throw new PhotoUploadValidationError("The selected file is empty.");
  }

  if (file.size > PHOTO_UPLOAD_MAX_FILE_SIZE_BYTES) {
    throw new PhotoUploadValidationError("Photo must be 10 MB or smaller.");
  }

  if (
    rejectedExtensions.has(extension) ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  ) {
    throw new PhotoUploadValidationError("HEIC photos are not supported yet.");
  }

  if (!acceptedMimeTypes.has(file.type)) {
    throw new PhotoUploadValidationError(
      "Only JPG, PNG and WebP photos are supported.",
    );
  }
}

async function saveProcessedPhoto(input: {
  file: File;
  rallyEventId: number;
  albumId: number;
  uploadBatchId: number;
  createdById: number;
}) {
  assertPhotoFile(input.file);

  const originalFilename = getOriginalFilename(input.file);
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const image = sharp(buffer).rotate();
  const filenamePart = sanitizeFilenamePart(originalFilename);
  const uniquePart = `${Date.now()}-${randomUUID()}`;
  const basePublicPath = `/uploads/rally-events/${input.rallyEventId}/albums/${input.albumId}`;
  const storageDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "rally-events",
    String(input.rallyEventId),
    "albums",
    String(input.albumId),
  );
  const displayFilename = `${uniquePart}-${filenamePart}.webp`;
  const thumbnailFilename = `${uniquePart}-${filenamePart}-thumb.webp`;
  const displayFilePath = path.join(storageDir, displayFilename);
  const thumbnailFilePath = path.join(storageDir, thumbnailFilename);
  const displayUrl = `${basePublicPath}/${displayFilename}`;
  const thumbnailUrl = `${basePublicPath}/${thumbnailFilename}`;

  await mkdir(storageDir, { recursive: true });

  const displayResult = await image
    .clone()
    .resize({ width: 2000, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });
  const thumbnailBuffer = await image
    .clone()
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  await Promise.all([
    writeFile(displayFilePath, displayResult.data),
    writeFile(thumbnailFilePath, thumbnailBuffer),
  ]);

  const width = displayResult.info.width;
  const height = displayResult.info.height;
  const aspectRatio = width && height ? (width / height).toFixed(4) : null;

  const [mediaItem] = await db
    .insert(mediaItems)
    .values({
      albumId: input.albumId,
      rallyEventId: input.rallyEventId,
      type: "photo",
      status: "ready",
      title: getDisplayName(originalFilename),
      createdById: input.createdById,
      uploadBatchId: input.uploadBatchId,
      originalFilename,
      thumbnailImageUrl: thumbnailUrl,
      displayImageUrl: displayUrl,
      mimeType: "image/webp",
      fileSizeBytes: displayResult.data.length,
      width,
      height,
      aspectRatio,
      updatedAt: new Date(),
    })
    .returning({ id: mediaItems.id });

  return {
    filename: originalFilename,
    mediaItemId: mediaItem.id,
  };
}

export async function uploadAlbumPhotos(input: {
  rallyEventId: number;
  albumId: number;
  currentUser: AuthUser;
  files: File[];
}): Promise<PhotoUploadResult | { status: "not-found" | "access-denied" }> {
  if (!canContribute(input.currentUser)) {
    throw new PhotoUploadValidationError(
      "Your account is not approved to upload photos.",
    );
  }

  if (input.files.length === 0) {
    throw new PhotoUploadValidationError("Choose at least one photo to upload.");
  }

  if (input.files.length > PHOTO_UPLOAD_MAX_FILES) {
    throw new PhotoUploadValidationError(
      `Upload ${PHOTO_UPLOAD_MAX_FILES} photos or fewer at a time.`,
    );
  }

  const albumAccess = await getEditableAlbum({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    currentUser: input.currentUser,
  });

  if (albumAccess.status !== "allowed") {
    return albumAccess;
  }

  const [batch] = await db
    .insert(uploadBatches)
    .values({
      rallyEventId: input.rallyEventId,
      albumId: input.albumId,
      createdById: input.currentUser.id,
      status: "processing",
      totalFiles: input.files.length,
    })
    .returning({ id: uploadBatches.id });

  const uploaded: UploadedPhotoResult[] = [];
  const failed: FailedPhotoResult[] = [];

  for (const file of input.files) {
    try {
      const result = await saveProcessedPhoto({
        file,
        rallyEventId: input.rallyEventId,
        albumId: input.albumId,
        uploadBatchId: batch.id,
        createdById: input.currentUser.id,
      });

      uploaded.push(result);
    } catch (error) {
      failed.push({
        filename: getOriginalFilename(file),
        error:
          error instanceof Error
            ? error.message
            : "This photo could not be processed.",
      });
    }
  }

  const status =
    uploaded.length === 0
      ? "failed"
      : failed.length > 0
        ? "completed_with_errors"
        : "completed";

  await db
    .update(uploadBatches)
    .set({
      status,
      processedFiles: uploaded.length,
      failedFiles: failed.length,
      completedAt: new Date(),
    })
    .where(eq(uploadBatches.id, batch.id));

  return {
    batchId: batch.id,
    status,
    uploaded,
    failed,
  };
}
