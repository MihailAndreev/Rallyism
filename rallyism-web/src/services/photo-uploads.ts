import { randomUUID } from "node:crypto";
import path from "node:path";

import { eq } from "drizzle-orm";
import sharp from "sharp";

import { db } from "@/db";
import { mediaItems, uploadBatches } from "@/db/schema";
import { canContribute } from "@/lib/auth/authorization";
import {
  deleteR2Object,
  getR2PublicUrl,
  uploadR2Object,
} from "@/lib/storage/r2";
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
  const uniquePart = randomUUID();
  const baseObjectKey = `rally-events/${input.rallyEventId}/albums/${input.albumId}/photos`;
  const displayImageR2Key = `${baseObjectKey}/${uniquePart}-main.webp`;
  const thumbnailImageR2Key = `${baseObjectKey}/${uniquePart}-thumb.webp`;
  const displayUrl = getR2PublicUrl(displayImageR2Key);
  const thumbnailUrl = getR2PublicUrl(thumbnailImageR2Key);

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

  // New uploads use R2 as primary storage. Existing DB rows with /uploads URLs
  // remain renderable; no local files are deleted or rewritten here.
  await Promise.all([
    uploadR2Object({
      key: displayImageR2Key,
      body: displayResult.data,
      contentType: "image/webp",
    }),
    uploadR2Object({
      key: thumbnailImageR2Key,
      body: thumbnailBuffer,
      contentType: "image/webp",
    }),
  ]);

  const width = displayResult.info.width;
  const height = displayResult.info.height;
  const aspectRatio = width && height ? (width / height).toFixed(4) : null;

  let mediaItem: { id: number };

  try {
    [mediaItem] = await db
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
        thumbnailImageR2Key,
        displayImageUrl: displayUrl,
        displayImageR2Key,
        mimeType: "image/webp",
        fileSizeBytes: displayResult.data.length,
        width,
        height,
        aspectRatio,
        updatedAt: new Date(),
      })
      .returning({ id: mediaItems.id });
  } catch (error) {
    await Promise.allSettled([
      deleteR2Object(displayImageR2Key),
      deleteR2Object(thumbnailImageR2Key),
    ]);

    throw error;
  }

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
