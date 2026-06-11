"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  deletePhoto,
  PhotoStorageDeleteError,
  PhotoValidationError,
  updatePhoto,
  validatePhotoInput,
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
    title: String(formData.get("title") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    location: String(formData.get("location") ?? ""),
    dateTaken: String(formData.get("dateTaken") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? ""),
    tags: String(formData.get("tags") ?? ""),
  };
}

function getErrorHref(
  rallyEventId: number,
  albumId: number,
  mediaId: number,
  message: string,
  returnTo?: string,
) {
  const params = new URLSearchParams({ error: message });

  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  return `/rally-events/${rallyEventId}/albums/${albumId}/photos/${mediaId}/edit?${params.toString()}`;
}

function getSafeAlbumReturnPath(formData: FormData, rallyEventId: number, albumId: number) {
  const fallback = `/rally-events/${rallyEventId}/albums/${albumId}?filter=photos#media-grid`;
  const rawReturnTo = String(formData.get("returnTo") ?? "");

  if (
    !rawReturnTo ||
    !rawReturnTo.startsWith("/") ||
    rawReturnTo.startsWith("//")
  ) {
    return fallback;
  }

  const expectedPrefix = `/rally-events/${rallyEventId}/albums/${albumId}`;

  return rawReturnTo.startsWith(expectedPrefix) ? rawReturnTo : fallback;
}

function appendToastToHref(href: string, toast: "photo-deleted") {
  const [withoutHash, hash = ""] = href.split("#");
  const [pathname, query = ""] = withoutHash.split("?");
  const params = new URLSearchParams(query);

  params.set("toast", toast);

  return `${pathname}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

export async function updatePhotoAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const { rallyEventId, albumId, mediaId } = getIds(formData);

  if (!rallyEventId || !albumId || !mediaId) {
    redirect("/dashboard");
  }

  const returnTo = getSafeAlbumReturnPath(formData, rallyEventId, albumId);
  let status: "allowed" | "not-found" | "access-denied" | null = null;

  try {
    const values = validatePhotoInput(getFormInput(formData));
    const result = await updatePhoto({
      rallyEventId,
      albumId,
      mediaId,
      currentUser: user,
      values,
    });

    status = result.status;
  } catch (error) {
    const message =
      error instanceof PhotoValidationError
        ? error.message
        : "The photo could not be updated.";

    redirect(getErrorHref(rallyEventId, albumId, mediaId, message, returnTo));
  }

  if (status === "not-found") {
    redirect(returnTo);
  }

  if (status === "access-denied") {
    redirect(
      getErrorHref(
        rallyEventId,
        albumId,
        mediaId,
        "You cannot edit this photo.",
        returnTo,
      ),
    );
  }

  redirect(returnTo);
}

export async function deletePhotoAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const { rallyEventId, albumId, mediaId } = getIds(formData);

  if (!rallyEventId || !albumId || !mediaId) {
    redirect("/dashboard");
  }

  const returnTo = getSafeAlbumReturnPath(formData, rallyEventId, albumId);
  let status: "allowed" | "not-found" | "access-denied" | null = null;

  try {
    const result = await deletePhoto({
      rallyEventId,
      albumId,
      mediaId,
      currentUser: user,
    });

    status = result.status;
  } catch (error) {
    const message =
      error instanceof PhotoStorageDeleteError ||
      error instanceof PhotoValidationError
        ? error.message
        : "The photo could not be deleted.";

    redirect(getErrorHref(rallyEventId, albumId, mediaId, message, returnTo));
  }

  if (status === "not-found") {
    redirect(returnTo);
  }

  if (status === "access-denied") {
    redirect(
      getErrorHref(
        rallyEventId,
        albumId,
        mediaId,
        "You cannot delete this photo.",
        returnTo,
      ),
    );
  }

  redirect(appendToastToHref(returnTo, "photo-deleted"));
}
