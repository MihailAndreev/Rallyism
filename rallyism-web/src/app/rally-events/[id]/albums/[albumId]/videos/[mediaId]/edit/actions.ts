"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  deleteVideo,
  updateVideo,
  validateVideoInput,
  VideoValidationError,
} from "@/services/rally-events";

function getId(formData: FormData, name: string) {
  const id = Number(formData.get(name));

  return Number.isInteger(id) && id > 0 ? id : null;
}

function getIds(formData: FormData) {
  return {
    rallyEventId: getId(formData, "rallyEventId"),
    albumId: getId(formData, "albumId"),
    mediaId: getId(formData, "mediaId"),
  };
}

function getFormInput(formData: FormData) {
  return {
    youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
    title: String(formData.get("title") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? ""),
  };
}

function getErrorHref(
  rallyEventId: number,
  albumId: number,
  mediaId: number,
  message: string,
) {
  const params = new URLSearchParams({ error: message });

  return `/rally-events/${rallyEventId}/albums/${albumId}/videos/${mediaId}/edit?${params.toString()}`;
}

function getAlbumVideosHref(rallyEventId: number, albumId: number) {
  return `/rally-events/${rallyEventId}/albums/${albumId}?filter=videos#media-grid`;
}

export async function updateVideoAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const { rallyEventId, albumId, mediaId } = getIds(formData);

  if (!rallyEventId || !albumId || !mediaId) {
    redirect("/dashboard");
  }

  let status: "allowed" | "not-found" | "access-denied" | null = null;

  try {
    const values = validateVideoInput(getFormInput(formData));
    const result = await updateVideo({
      rallyEventId,
      albumId,
      mediaId,
      currentUser: user,
      values,
    });

    status = result.status;
  } catch (error) {
    const message =
      error instanceof VideoValidationError
        ? error.message
        : "The YouTube video could not be updated.";

    redirect(getErrorHref(rallyEventId, albumId, mediaId, message));
  }

  if (status === "not-found") {
    redirect(getAlbumVideosHref(rallyEventId, albumId));
  }

  if (status === "access-denied") {
    redirect(getErrorHref(rallyEventId, albumId, mediaId, "You cannot edit this video."));
  }

  redirect(getAlbumVideosHref(rallyEventId, albumId));
}

export async function deleteVideoAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const { rallyEventId, albumId, mediaId } = getIds(formData);

  if (!rallyEventId || !albumId || !mediaId) {
    redirect("/dashboard");
  }

  const result = await deleteVideo({
    rallyEventId,
    albumId,
    mediaId,
    currentUser: user,
  });

  if (result.status === "not-found") {
    redirect(getAlbumVideosHref(rallyEventId, albumId));
  }

  if (result.status === "access-denied") {
    redirect(getErrorHref(rallyEventId, albumId, mediaId, "You cannot delete this video."));
  }

  redirect(getAlbumVideosHref(rallyEventId, albumId));
}
