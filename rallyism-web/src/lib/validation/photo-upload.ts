import path from "node:path";

export const PHOTO_UPLOAD_MAX_FILES = 10;
export const PHOTO_UPLOAD_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const acceptedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const rejectedExtensions = new Set([".heic", ".heif"]);

export type PhotoUploadFileLike = {
  name?: string;
  size: number;
  type: string;
};

export class PhotoUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoUploadValidationError";
  }
}

export function getOriginalFilename(file: PhotoUploadFileLike) {
  return file.name?.trim() || "photo";
}

export function getPhotoDisplayName(filename: string) {
  const parsed = path.parse(filename);

  return parsed.name || "Photo";
}

export function validatePhotoFile(file: PhotoUploadFileLike) {
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

export function validatePhotoUploadBatch(files: PhotoUploadFileLike[]) {
  if (files.length === 0) {
    throw new PhotoUploadValidationError("Choose at least one photo to upload.");
  }

  if (files.length > PHOTO_UPLOAD_MAX_FILES) {
    throw new PhotoUploadValidationError(
      `Upload ${PHOTO_UPLOAD_MAX_FILES} photos or fewer at a time.`,
    );
  }
}
