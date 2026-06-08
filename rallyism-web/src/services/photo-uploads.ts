import { randomUUID } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import sharp from "sharp";

import { db } from "@/db";
import { mediaItems, uploadBatches } from "@/db/schema";
import { canContribute } from "@/lib/auth/authorization";
import {
  createPresignedR2PutUrl,
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

type DirectPhotoUploadFileInput = {
  name: string;
  size: number;
  type: string;
};

type DirectPhotoUploadObjectTarget = {
  key: string;
  publicUrl: string;
  uploadUrl: string;
  headers: Record<string, string>;
};

export type DirectPhotoUploadTarget = {
  filename: string;
  display: DirectPhotoUploadObjectTarget;
  thumbnail: DirectPhotoUploadObjectTarget;
};

export type DirectPhotoUploadPlan = {
  batchId: number;
  targets: DirectPhotoUploadTarget[];
  warnings: PhotoUploadWarning[];
};

export type FinalizeDirectPhotoUploadInput = {
  rallyEventId: number;
  albumId: number;
  batchId: number;
  uploaded: {
    filename: string;
    displayImageR2Key: string;
    thumbnailImageR2Key: string;
    fileSizeBytes: number;
    width: number;
    height: number;
  }[];
  failed: FailedPhotoResult[];
};

export type PhotoUploadResult = {
  batchId: number;
  status: "completed" | "completed_with_errors" | "failed";
  uploaded: UploadedPhotoResult[];
  failed: FailedPhotoResult[];
  warnings: PhotoUploadWarning[];
};

function getPhotoBaseObjectKey(input: { rallyEventId: number; albumId: number }) {
  return `rally-events/${input.rallyEventId}/albums/${input.albumId}/photos`;
}

function getPhotoObjectPrefix(input: { rallyEventId: number; albumId: number }) {
  return `${getPhotoBaseObjectKey(input)}/`;
}

function isExpectedPhotoObjectKey(
  key: string,
  input: { rallyEventId: number; albumId: number },
) {
  return key.startsWith(getPhotoObjectPrefix(input)) && key.endsWith(".webp");
}

async function getExistingAlbumFilenames(input: {
  albumId: number;
  filenames: string[];
}) {
  const filteredFilenames = input.filenames.filter(Boolean);

  if (filteredFilenames.length === 0) {
    return new Set<string>();
  }

  const rows = await db
    .select({ originalFilename: mediaItems.originalFilename })
    .from(mediaItems)
    .where(
      and(
        eq(mediaItems.albumId, input.albumId),
        eq(mediaItems.type, "photo"),
        inArray(mediaItems.originalFilename, filteredFilenames),
      ),
    );

  return new Set(
    rows
      .map((row) => row.originalFilename)
      .filter((filename): filename is string => Boolean(filename)),
  );
}

function getDuplicateFilenameWarnings(input: {
  filenames: string[];
  existingAlbumFilenames: Set<string>;
}) {
  return input.filenames
    .filter((filename) => input.existingAlbumFilenames.has(filename))
    .map((filename) => ({
      filename,
      message: `${filename} was uploaded, but a file with this name already exists in this album.`,
    }));
}

async function createDirectPhotoTarget(input: {
  rallyEventId: number;
  albumId: number;
  filename: string;
}) {
  const uniquePart = randomUUID();
  const baseObjectKey = getPhotoBaseObjectKey(input);
  const displayImageR2Key = `${baseObjectKey}/${uniquePart}-main.webp`;
  const thumbnailImageR2Key = `${baseObjectKey}/${uniquePart}-thumb.webp`;
  const [displayUpload, thumbnailUpload] = await Promise.all([
    createPresignedR2PutUrl({
      key: displayImageR2Key,
      contentType: "image/webp",
    }),
    createPresignedR2PutUrl({
      key: thumbnailImageR2Key,
      contentType: "image/webp",
    }),
  ]);

  return {
    filename: input.filename,
    display: {
      key: displayImageR2Key,
      publicUrl: getR2PublicUrl(displayImageR2Key),
      uploadUrl: displayUpload.url,
      headers: displayUpload.headers,
    },
    thumbnail: {
      key: thumbnailImageR2Key,
      publicUrl: getR2PublicUrl(thumbnailImageR2Key),
      uploadUrl: thumbnailUpload.url,
      headers: thumbnailUpload.headers,
    },
  };
}

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
  const baseObjectKey = getPhotoBaseObjectKey(input);
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
  const uploadFilenames = input.files.map(getOriginalFilename);
  const existingAlbumFilenames = await getExistingAlbumFilenames({
    albumId: input.albumId,
    filenames: uploadFilenames,
  });
  const warnings = getDuplicateFilenameWarnings({
    filenames: uploadFilenames,
    existingAlbumFilenames,
  });

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

export async function createDirectPhotoUploadPlan(input: {
  rallyEventId: number;
  albumId: number;
  currentUser: AuthUser;
  files: DirectPhotoUploadFileInput[];
}): Promise<DirectPhotoUploadPlan | { status: "not-found" | "access-denied" }> {
  if (!canContribute(input.currentUser)) {
    throw new PhotoUploadValidationError(
      "Your account is not approved to upload photos.",
    );
  }

  validatePhotoUploadBatch(input.files);
  input.files.forEach(validatePhotoFile);

  const albumAccess = await getEditableAlbum({
    rallyEventId: input.rallyEventId,
    albumId: input.albumId,
    currentUser: input.currentUser,
  });

  if (albumAccess.status !== "allowed") {
    return albumAccess;
  }

  const filenames = input.files.map(getOriginalFilename);
  const [batch, existingAlbumFilenames] = await Promise.all([
    db
      .insert(uploadBatches)
      .values({
        rallyEventId: input.rallyEventId,
        albumId: input.albumId,
        createdById: input.currentUser.id,
        status: "uploading",
        totalFiles: input.files.length,
      })
      .returning({ id: uploadBatches.id })
      .then((rows) => rows[0]),
    getExistingAlbumFilenames({
      albumId: input.albumId,
      filenames,
    }),
  ]);
  const targets = await Promise.all(
    filenames.map((filename) =>
      createDirectPhotoTarget({
        rallyEventId: input.rallyEventId,
        albumId: input.albumId,
        filename,
      }),
    ),
  );

  return {
    batchId: batch.id,
    targets,
    warnings: getDuplicateFilenameWarnings({
      filenames,
      existingAlbumFilenames,
    }),
  };
}

export async function finalizeDirectPhotoUpload(input: {
  currentUser: AuthUser;
  values: FinalizeDirectPhotoUploadInput;
}): Promise<PhotoUploadResult | { status: "not-found" | "access-denied" }> {
  const { values } = input;

  if (!canContribute(input.currentUser)) {
    throw new PhotoUploadValidationError(
      "Your account is not approved to upload photos.",
    );
  }

  const albumAccess = await getEditableAlbum({
    rallyEventId: values.rallyEventId,
    albumId: values.albumId,
    currentUser: input.currentUser,
  });

  if (albumAccess.status !== "allowed") {
    return albumAccess;
  }

  const [batch] = await db
    .select()
    .from(uploadBatches)
    .where(
      and(
        eq(uploadBatches.id, values.batchId),
        eq(uploadBatches.rallyEventId, values.rallyEventId),
        eq(uploadBatches.albumId, values.albumId),
        eq(uploadBatches.createdById, input.currentUser.id),
      ),
    )
    .limit(1);

  if (!batch) {
    return { status: "not-found" };
  }

  const uploaded: UploadedPhotoResult[] = [];
  const failed: FailedPhotoResult[] = [...values.failed];

  for (const photo of values.uploaded) {
    const displayKeyAllowed = isExpectedPhotoObjectKey(
      photo.displayImageR2Key,
      values,
    );
    const thumbnailKeyAllowed = isExpectedPhotoObjectKey(
      photo.thumbnailImageR2Key,
      values,
    );

    if (!displayKeyAllowed || !thumbnailKeyAllowed) {
      failed.push({
        filename: photo.filename,
        error: "This photo could not be saved because its upload target was invalid.",
      });
      continue;
    }

    try {
      const width = Math.max(1, Math.round(photo.width));
      const height = Math.max(1, Math.round(photo.height));
      const aspectRatio = (width / height).toFixed(4);
      const [mediaItem] = await db
        .insert(mediaItems)
        .values({
          albumId: values.albumId,
          rallyEventId: values.rallyEventId,
          type: "photo",
          status: "ready",
          title: getPhotoDisplayName(photo.filename),
          createdById: input.currentUser.id,
          uploadBatchId: values.batchId,
          originalFilename: photo.filename,
          thumbnailImageUrl: getR2PublicUrl(photo.thumbnailImageR2Key),
          thumbnailImageR2Key: photo.thumbnailImageR2Key,
          displayImageUrl: getR2PublicUrl(photo.displayImageR2Key),
          displayImageR2Key: photo.displayImageR2Key,
          mimeType: "image/webp",
          fileSizeBytes: Math.max(0, Math.round(photo.fileSizeBytes)),
          width,
          height,
          aspectRatio,
          updatedAt: new Date(),
        })
        .returning({ id: mediaItems.id });

      uploaded.push({
        filename: photo.filename,
        mediaItemId: mediaItem.id,
      });
    } catch (error) {
      await Promise.allSettled([
        deleteR2Object(photo.displayImageR2Key),
        deleteR2Object(photo.thumbnailImageR2Key),
      ]);
      failed.push({
        filename: photo.filename,
        error:
          error instanceof Error
            ? error.message
            : "This photo could not be saved.",
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
    .where(eq(uploadBatches.id, values.batchId));

  return {
    batchId: values.batchId,
    status,
    uploaded,
    failed,
    warnings: [],
  };
}
