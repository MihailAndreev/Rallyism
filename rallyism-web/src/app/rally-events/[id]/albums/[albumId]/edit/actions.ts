"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  AlbumValidationError,
  deleteAlbum,
  MediaStorageCleanupError,
  RallyEventValidationError,
  updateAlbum,
  validateAlbumInput,
} from "@/services/rally-events";

function getFormInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    albumDate: String(formData.get("albumDate") ?? ""),
    coverImageUrl: String(formData.get("coverImageUrl") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? ""),
  };
}

function getId(formData: FormData, name: string) {
  const id = Number(formData.get(name));

  return Number.isInteger(id) && id > 0 ? id : null;
}

function getErrorHref(rallyEventId: number, albumId: number, message: string) {
  const params = new URLSearchParams({ error: message });

  return `/rally-events/${rallyEventId}/albums/${albumId}/edit?${params.toString()}`;
}

export async function updateAlbumAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const rallyEventId = getId(formData, "rallyEventId");
  const albumId = getId(formData, "albumId");

  if (!rallyEventId || !albumId) {
    redirect("/dashboard");
  }

  let accessStatus: "allowed" | "not-found" | "access-denied" | null = null;

  try {
    const values = validateAlbumInput(getFormInput(formData));
    const result = await updateAlbum({
      rallyEventId,
      albumId,
      currentUser: user,
      values,
    });

    accessStatus = result.status;
  } catch (error) {
    const message =
      error instanceof AlbumValidationError ||
      error instanceof RallyEventValidationError
        ? error.message
        : "The album could not be updated.";

    redirect(getErrorHref(rallyEventId, albumId, message));
  }

  if (accessStatus === "not-found") {
    redirect(`/rally-events/${rallyEventId}`);
  }

  if (accessStatus === "access-denied") {
    redirect(
      `/rally-events/${rallyEventId}/albums/${albumId}/edit?error=You%20cannot%20edit%20this%20album.`,
    );
  }

  redirect(`/rally-events/${rallyEventId}/albums/${albumId}`);
}

export async function deleteAlbumAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const rallyEventId = getId(formData, "rallyEventId");
  const albumId = getId(formData, "albumId");

  if (!rallyEventId || !albumId) {
    redirect("/dashboard");
  }

  if (String(formData.get("confirmation") ?? "").trim() !== "DELETE") {
    redirect(getErrorHref(rallyEventId, albumId, "Type DELETE to confirm album deletion."));
  }

  let accessStatus: "allowed" | "not-found" | "access-denied" | null = null;

  try {
    const result = await deleteAlbum({
      rallyEventId,
      albumId,
      currentUser: user,
    });

    accessStatus = result.status;
  } catch (error) {
    const message =
      error instanceof AlbumValidationError ||
      error instanceof RallyEventValidationError ||
      error instanceof MediaStorageCleanupError
        ? error.message
        : "The album could not be deleted.";

    redirect(getErrorHref(rallyEventId, albumId, message));
  }

  if (accessStatus === "not-found") {
    redirect(`/rally-events/${rallyEventId}`);
  }

  if (accessStatus === "access-denied") {
    redirect(getErrorHref(rallyEventId, albumId, "You cannot delete this album."));
  }

  redirect(`/rally-events/${rallyEventId}?toast=album-deleted`);
}
