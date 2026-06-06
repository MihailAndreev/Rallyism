"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  PhotoUploadValidationError,
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
}) {
  const params = new URLSearchParams({
    filter: "photos",
    uploadStatus: input.status,
    uploaded: String(input.uploaded),
    failed: String(input.failed),
  });

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
    }),
  );
}
