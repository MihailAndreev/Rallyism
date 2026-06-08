"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  createDirectPhotoUploadPlan,
  finalizeDirectPhotoUpload,
  PhotoUploadValidationError,
  type DirectPhotoUploadPlan,
  type FinalizeDirectPhotoUploadInput,
  type PhotoUploadResult,
  uploadAlbumPhotos,
} from "@/services/photo-uploads";

function getId(formData: FormData, name: string) {
  const id = Number(formData.get(name));

  return Number.isInteger(id) && id > 0 ? id : null;
}

function getUploadFiles(formData: FormData) {
  return formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function getUploadPageHref(
  rallyEventId: number,
  albumId: number,
  message: string,
) {
  const params = new URLSearchParams({ error: message });

  return `/rally-events/${rallyEventId}/albums/${albumId}/photos/upload?${params.toString()}`;
}

function getAlbumResultHref(input: {
  rallyEventId: number;
  albumId: number;
  status: string;
  uploaded: number;
  failed: number;
  failedDetails: PhotoUploadResult["failed"];
  warnings: PhotoUploadResult["warnings"];
}) {
  const params = new URLSearchParams({
    filter: "photos",
    uploadStatus: input.status,
    uploaded: String(input.uploaded),
    failed: String(input.failed),
  });

  if (input.failedDetails.length > 0) {
    params.set("uploadFailedDetails", JSON.stringify(input.failedDetails));
  }

  if (input.warnings.length > 0) {
    params.set("uploadWarnings", JSON.stringify(input.warnings));
  }

  return `/rally-events/${input.rallyEventId}/albums/${input.albumId}?${params.toString()}`;
}

export async function uploadPhotosAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const rallyEventId = getId(formData, "rallyEventId");
  const albumId = getId(formData, "albumId");

  if (!rallyEventId || !albumId) {
    redirect("/dashboard");
  }

  let result:
    | PhotoUploadResult
    | { status: "not-found" | "access-denied" }
    | null = null;

  try {
    result = await uploadAlbumPhotos({
      rallyEventId,
      albumId,
      currentUser: user,
      files: getUploadFiles(formData),
    });
  } catch (error) {
    const message =
      error instanceof PhotoUploadValidationError
        ? error.message
        : "The photos could not be uploaded.";

    redirect(getUploadPageHref(rallyEventId, albumId, message));
  }

  if (!result) {
    redirect(getUploadPageHref(rallyEventId, albumId, "The photos could not be uploaded."));
  }

  if (result.status === "not-found") {
    redirect(`/rally-events/${rallyEventId}`);
  }

  if (result.status === "access-denied") {
    redirect(
      getUploadPageHref(
        rallyEventId,
        albumId,
        "You cannot upload photos to this album.",
      ),
    );
  }

  if (!("uploaded" in result)) {
    redirect(
      getUploadPageHref(
        rallyEventId,
        albumId,
        "The photos could not be uploaded.",
      ),
    );
  }

  redirect(
    getAlbumResultHref({
      rallyEventId,
      albumId,
      status: result.status,
      uploaded: result.uploaded.length,
      failed: result.failed.length,
      failedDetails: result.failed,
      warnings: result.warnings,
    }),
  );
}

export type CreateDirectPhotoUploadPlanActionResult =
  | { status: "ready"; plan: DirectPhotoUploadPlan }
  | { status: "error"; error: string };

export async function createDirectPhotoUploadPlanAction(input: {
  rallyEventId: number;
  albumId: number;
  files: { name: string; size: number; type: string }[];
}): Promise<CreateDirectPhotoUploadPlanActionResult> {
  const user = await requireContributor("/dashboard");

  if (!user) {
    return { status: "error", error: "Your account is not approved to upload photos." };
  }

  if (!Number.isInteger(input.rallyEventId) || !Number.isInteger(input.albumId)) {
    return { status: "error", error: "The upload target is invalid." };
  }

  try {
    const result = await createDirectPhotoUploadPlan({
      rallyEventId: input.rallyEventId,
      albumId: input.albumId,
      currentUser: user,
      files: input.files,
    });

    if (!("batchId" in result)) {
      return {
        status: "error",
        error:
          result.status === "not-found"
            ? "This album could not be found."
            : "You cannot upload photos to this album.",
      };
    }

    return { status: "ready", plan: result };
  } catch (error) {
    return {
      status: "error",
      error:
        error instanceof PhotoUploadValidationError
          ? error.message
          : "The photos could not be prepared for upload.",
    };
  }
}

export type FinalizeDirectPhotoUploadActionResult =
  | { status: "ready"; result: PhotoUploadResult }
  | { status: "error"; error: string };

export async function finalizeDirectPhotoUploadAction(
  values: FinalizeDirectPhotoUploadInput,
): Promise<FinalizeDirectPhotoUploadActionResult> {
  const user = await requireContributor("/dashboard");

  if (!user) {
    return { status: "error", error: "Your account is not approved to upload photos." };
  }

  try {
    const result = await finalizeDirectPhotoUpload({
      currentUser: user,
      values,
    });

    if (!("uploaded" in result)) {
      return {
        status: "error",
        error:
          result.status === "not-found"
            ? "This upload session could not be found."
            : "You cannot upload photos to this album.",
      };
    }

    return { status: "ready", result };
  } catch (error) {
    return {
      status: "error",
      error:
        error instanceof PhotoUploadValidationError
          ? error.message
          : "The photos could not be saved after upload.",
    };
  }
}
