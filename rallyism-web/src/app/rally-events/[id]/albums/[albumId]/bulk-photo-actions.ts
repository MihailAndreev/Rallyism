"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  bulkDeletePhotos,
  MediaStorageCleanupError,
  PhotoValidationError,
} from "@/services/rally-events";

function getId(formData: FormData, name: string) {
  const id = Number(formData.get(name));

  return Number.isInteger(id) && id > 0 ? id : null;
}

function getPhotoIds(formData: FormData) {
  return formData
    .getAll("photoIds")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

function getAlbumPhotosHref(input: {
  rallyEventId: number;
  albumId: number;
  deleted?: number;
  error?: string;
}) {
  const params = new URLSearchParams({ filter: "photos" });

  if (input.deleted) {
    params.set("bulkDeleted", String(input.deleted));
  }

  if (input.error) {
    params.set("bulkError", input.error);
  }

  return `/rally-events/${input.rallyEventId}/albums/${input.albumId}?${params.toString()}`;
}

export async function bulkDeletePhotosAction(formData: FormData) {
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
    | { status: "allowed"; deletedCount: number }
    | { status: "not-found" | "access-denied" }
    | null = null;

  try {
    result = await bulkDeletePhotos({
      rallyEventId,
      albumId,
      mediaIds: getPhotoIds(formData),
      currentUser: user,
    });
  } catch (error) {
    const message =
      error instanceof PhotoValidationError ||
      error instanceof MediaStorageCleanupError
        ? error.message
        : "The selected photos could not be deleted.";

    redirect(getAlbumPhotosHref({ rallyEventId, albumId, error: message }));
  }

  if (!result || result.status === "not-found") {
    redirect(`/rally-events/${rallyEventId}`);
  }

  if (result.status === "access-denied") {
    redirect(
      getAlbumPhotosHref({
        rallyEventId,
        albumId,
        error: "You cannot delete one or more selected photos.",
      }),
    );
  }

  if (!("deletedCount" in result)) {
    redirect(
      getAlbumPhotosHref({
        rallyEventId,
        albumId,
        error: "The selected photos could not be deleted.",
      }),
    );
  }

  redirect(
    getAlbumPhotosHref({
      rallyEventId,
      albumId,
      deleted: result.deletedCount,
    }),
  );
}
