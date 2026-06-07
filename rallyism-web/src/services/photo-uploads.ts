import { randomUUID } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import sharp from "sharp";

import { db } from "@/db";
import { mediaItems, uploadBatches } from "@/db/schema";
import { canContribute } from "@/lib/auth/authorization";
import {
  deleteR2Object,
  getR2PublicUrl,
  uploadR2Object,
} from "@/lib/storage/r2";
import {
  getOriginalFilename,
  getPhotoDisplayName,
  PhotoUploadValidationError,
  validatePhotoFile,
  validatePhotoUploadBatch,
} from "@/lib/validation/photo-upload";
import { getEditableAlbum } from "@/services/rally-events";
import type { AuthUser } from "@/services/users";

export {
  PHOTO_UPLOAD_MAX_FILE_SIZE_BYTES,
  PHOTO_UPLOAD_MAX_FILES,
  PhotoUploadValidationError,
} from "@/lib/validation/photo-upload";

type UploadedPhotoResult = {
  filename: string;
  mediaItemId: number;
};

type FailedPhotoResult = {
  filename: string;
  error: string;
};

type PhotoUploadWarning = {
  filename: string;
  message: string;
};

export type PhotoUploadResult = {
  batchId: number;
  status: "completed" | "completed_with_errors" | "failed";
  uploaded: UploadedPhotoResult[];
  failed: FailedPhotoResult[];
  warnings: PhotoUploadWarning[];
};

async function saveProcessedPhoto(input: {
  file: File;
  rallyEventId: number;
  albumId: number;
  uploadBatchId: number;
  createdById: number;
}) {
  validatePhotoFile(input.file);

  const originalFilename = getOriginalFilename(input.file);
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const image = sharp(buffer, { failOn: "none" }).rotate();
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
        title: getPhotoDisplayName(originalFilename),
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

  validatePhotoUploadBatch(input.files);

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
  const warnings: PhotoUploadWarning[] = [];
  const uploadFilenames = input.files.map(getOriginalFilename);
  const existingFilenameRows =
    uploadFilenames.length > 0
      ? await db
          .select({ originalFilename: mediaItems.originalFilename })
          .from(mediaItems)
          .where(
            and(
              eq(mediaItems.albumId, input.albumId),
              eq(mediaItems.type, "photo"),
              inArray(
                mediaItems.originalFilename,
                uploadFilenames.filter(Boolean),
              ),
            ),
          )
      : [];
  const existingAlbumFilenames = new Set(
    existingFilenameRows
      .map((row) => row.originalFilename)
      .filter((filename): filename is string => Boolean(filename)),
  );

  for (const file of input.files) {
    const filename = getOriginalFilename(file);

    try {
      const result = await saveProcessedPhoto({
        file,
        rallyEventId: input.rallyEventId,
        albumId: input.albumId,
        uploadBatchId: batch.id,
        createdById: input.currentUser.id,
      });

      uploaded.push(result);
      if (existingAlbumFilenames.has(filename)) {
        warnings.push({
          filename,
          message: `${filename} was uploaded, but a file with this name already exists in this album.`,
        });
      }
    } catch (error) {
      failed.push({
        filename,
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
    warnings,
  };
}
