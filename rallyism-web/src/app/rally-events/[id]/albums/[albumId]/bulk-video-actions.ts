"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import { bulkDeleteVideos } from "@/services/rally-events";

function getId(formData: FormData, name: string) {
  const id = Number(formData.get(name));

  return Number.isInteger(id) && id > 0 ? id : null;
}

function getVideoIds(formData: FormData) {
  return formData
    .getAll("videoIds")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

function getAlbumVideosHref(input: {
  rallyEventId: number;
  albumId: number;
  deleted?: number;
  failed?: boolean;
}) {
  const params = new URLSearchParams({ filter: "videos" });

  if (input.deleted) {
    params.set("toast", "videos-deleted");
    params.set("count", String(input.deleted));
  }

  if (input.failed) {
    params.set("toast", "videos-delete-failed");
  }

  return `/rally-events/${input.rallyEventId}/albums/${input.albumId}?${params.toString()}`;
}

export async function bulkDeleteVideosAction(formData: FormData) {
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
    result = await bulkDeleteVideos({
      rallyEventId,
      albumId,
      mediaIds: getVideoIds(formData),
      currentUser: user,
    });
  } catch {
    redirect(getAlbumVideosHref({ rallyEventId, albumId, failed: true }));
  }

  if (!result || result.status === "not-found") {
    redirect(`/rally-events/${rallyEventId}`);
  }

  if (result.status === "access-denied") {
    redirect(getAlbumVideosHref({ rallyEventId, albumId, failed: true }));
  }

  if (!("deletedCount" in result)) {
    redirect(getAlbumVideosHref({ rallyEventId, albumId, failed: true }));
  }

  redirect(
    getAlbumVideosHref({
      rallyEventId,
      albumId,
      deleted: result.deletedCount,
    }),
  );
}
