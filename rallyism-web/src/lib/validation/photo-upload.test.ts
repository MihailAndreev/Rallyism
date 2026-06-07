import { describe, expect, it } from "vitest";

import {
  PHOTO_UPLOAD_MAX_FILE_SIZE_BYTES,
  PHOTO_UPLOAD_MAX_FILES,
  PhotoUploadValidationError,
  validatePhotoFile,
  validatePhotoUploadBatch,
  type PhotoUploadFileLike,
} from "./photo-upload";

function file(overrides: Partial<PhotoUploadFileLike> = {}): PhotoUploadFileLike {
  return {
    name: "photo.jpg",
    size: 1024,
    type: "image/jpeg",
    ...overrides,
  };
}

describe("photo upload validation", () => {
  it("accepts jpg, jpeg, png and webp mime types", () => {
    expect(() => validatePhotoFile(file({ type: "image/jpeg" }))).not.toThrow();
    expect(() => validatePhotoFile(file({ type: "image/png" }))).not.toThrow();
    expect(() => validatePhotoFile(file({ type: "image/webp" }))).not.toThrow();
  });

  it("rejects HEIC by extension and mime type", () => {
    expect(() =>
      validatePhotoFile(file({ name: "photo.heic", type: "image/jpeg" })),
    ).toThrow(PhotoUploadValidationError);
    expect(() =>
      validatePhotoFile(file({ name: "photo.jpg", type: "image/heic" })),
    ).toThrow("HEIC photos are not supported yet.");
  });

  it("rejects unsupported mime types", () => {
    expect(() => validatePhotoFile(file({ type: "image/gif" }))).toThrow(
      "Only JPG, PNG and WebP photos are supported.",
    );
  });

  it("rejects files over 10 MB", () => {
    expect(() =>
      validatePhotoFile(file({ size: PHOTO_UPLOAD_MAX_FILE_SIZE_BYTES + 1 })),
    ).toThrow("Photo must be 10 MB or smaller.");
  });

  it("enforces maximum batch size", () => {
    const files = Array.from({ length: PHOTO_UPLOAD_MAX_FILES + 1 }, () => file());

    expect(() => validatePhotoUploadBatch(files)).toThrow(
      `Upload ${PHOTO_UPLOAD_MAX_FILES} photos or fewer at a time.`,
    );
  });

  it("rejects empty batches", () => {
    expect(() => validatePhotoUploadBatch([])).toThrow(
      "Choose at least one photo to upload.",
    );
  });
});
