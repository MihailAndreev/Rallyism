"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  AlbumValidationError,
  createAlbum,
  RallyEventValidationError,
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

function getRallyEventId(formData: FormData) {
  const rallyEventId = Number(formData.get("rallyEventId"));

  return Number.isInteger(rallyEventId) && rallyEventId > 0 ? rallyEventId : null;
}

function getErrorHref(rallyEventId: number, message: string) {
  const params = new URLSearchParams({ error: message });

  return `/rally-events/${rallyEventId}/albums/new?${params.toString()}`;
}

export async function createAlbumAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const rallyEventId = getRallyEventId(formData);

  if (!rallyEventId) {
    redirect("/dashboard");
  }

  let albumId: number | null = null;
  let accessStatus: "allowed" | "not-found" | "access-denied" | null = null;

  try {
    const values = validateAlbumInput(getFormInput(formData));
    const result = await createAlbum({ rallyEventId, currentUser: user, values });

    accessStatus = result.status;

    if (result.status === "allowed") {
      albumId = result.album.id;
    }
  } catch (error) {
    const message =
      error instanceof AlbumValidationError ||
      error instanceof RallyEventValidationError
        ? error.message
        : "The album could not be created.";

    redirect(getErrorHref(rallyEventId, message));
  }

  if (accessStatus === "not-found") {
    redirect("/dashboard");
  }

  if (accessStatus === "access-denied") {
    redirect(
      `/rally-events/${rallyEventId}/albums/new?error=You%20cannot%20create%20albums%20in%20this%20rally%20event.`,
    );
  }

  redirect(`/rally-events/${rallyEventId}/albums/${albumId}`);
}
