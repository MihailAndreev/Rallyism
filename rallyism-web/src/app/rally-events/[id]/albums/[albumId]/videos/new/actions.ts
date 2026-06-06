"use server";

import { redirect } from "next/navigation";

import { requireContributor } from "@/lib/auth/authorization";
import {
  createVideo,
  validateVideoInput,
  VideoValidationError,
} from "@/services/rally-events";

function getId(formData: FormData, name: string) {
  const id = Number(formData.get(name));

  return Number.isInteger(id) && id > 0 ? id : null;
}

function getFormInput(formData: FormData) {
  return {
    youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
    title: String(formData.get("title") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? ""),
  };
}

function getErrorHref(rallyEventId: number, albumId: number, message: string) {
  const params = new URLSearchParams({ error: message });

  return `/rally-events/${rallyEventId}/albums/${albumId}/videos/new?${params.toString()}`;
}

export async function createVideoAction(formData: FormData) {
  const user = await requireContributor("/dashboard");

  if (!user) {
    redirect("/pending-approval");
  }

  const rallyEventId = getId(formData, "rallyEventId");
  const albumId = getId(formData, "albumId");

  if (!rallyEventId || !albumId) {
    redirect("/dashboard");
  }

  let status: "allowed" | "not-found" | "access-denied" | null = null;

  try {
    const values = validateVideoInput(getFormInput(formData));
    const result = await createVideo({
      rallyEventId,
      albumId,
      currentUser: user,
      values,
    });

    status = result.status;
  } catch (error) {
    const message =
      error instanceof VideoValidationError
        ? error.message
        : "The YouTube video could not be added.";

    redirect(getErrorHref(rallyEventId, albumId, message));
  }

  if (status === "not-found") {
    redirect(`/rally-events/${rallyEventId}`);
  }

  if (status === "access-denied") {
    redirect(
      `/rally-events/${rallyEventId}/albums/${albumId}/videos/new?error=You%20cannot%20add%20videos%20to%20this%20album.`,
    );
  }

  redirect(`/rally-events/${rallyEventId}/albums/${albumId}?filter=videos`);
}
