"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import { bulkDeletePhotos } from "@/services/rally-events";

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
  failed?: boolean;
}) {
  const params = new URLSearchParams({ filter: "photos" });

  if (input.deleted) {
    params.set("toast", "photos-deleted");
    params.set("count", String(input.deleted));
  }

  if (input.failed) {
    params.set("toast", "photos-delete-failed");
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
  } catch {
    redirect(getAlbumPhotosHref({ rallyEventId, albumId, failed: true }));
  }

  if (!result || result.status === "not-found") {
    redirect(`/rally-events/${rallyEventId}`);
  }

  if (result.status === "access-denied") {
    redirect(
      getAlbumPhotosHref({
        rallyEventId,
        albumId,
        failed: true,
      }),
    );
  }

  if (!("deletedCount" in result)) {
    redirect(
      getAlbumPhotosHref({
        rallyEventId,
        albumId,
        failed: true,
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
